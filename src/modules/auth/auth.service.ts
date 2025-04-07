import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { addMinutes } from 'date-fns';
import { COMPANY_NAME } from 'src/constants/global.constant';
import { ResourceNotFoundException } from 'src/exceptions';
import { MailService } from 'src/mail/mail.service';
import { AuthenticatorService } from 'src/security/authenticator.service';
import { JwtTokenUtil } from '../../utils/jwt-token.util';
import { SecurityUtil } from '../../utils/security.util';
import { S3ConfigService } from '../config/s3.config';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { UserService } from '../user/user.service';
import { AdminLoginDto } from './dto/admin.login';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { CheckTotpDto } from './dto/check-totp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtTokenUtil: JwtTokenUtil,
        private readonly securityUtil: SecurityUtil,
        private readonly mailService: MailService,
        private readonly authenticatorService: AuthenticatorService,
        private readonly userService: UserService,
        private readonly s3ConfigService: S3ConfigService,
    ) {}

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) return null;

        console.log('🔍 Debugging validateUser:');
        console.log('🔑 Entered Password:', password);
        console.log('🔒 Stored Hashed Password:', user.password);

        const isPasswordValid = await this.securityUtil.verifyPassword(
            password,
            user.password,
        );
        console.log('✅ Password Match Result:', isPasswordValid);

        if (!isPasswordValid) return null;

        return user;
    }

    // async login(dto: LoginDto) {
    //     const user = await this.userRepository.findByEmail(dto.email);
    //     if (!user) {
    //         console.log('🚨 User not found for email:', dto.email);
    //         throw new NotFoundException('User not found.');
    //     }

    //     console.log('✅ Found user:', user.email);
    //     console.log('🔒 Stored password hash:', user.password);
    //     console.log('🔑 Entered password:', dto.password);

    //     const isPasswordValid = await this.securityUtil.verifyPassword(
    //         dto.password,
    //         user.password,
    //     );

    //     console.log('🔎 Password Valid:', isPasswordValid);

    //     if (!isPasswordValid) {
    //         console.log('🚨 Invalid password for:', dto.email);
    //         throw new BadRequestException('Invalid credentials.');
    //     }

    //     // ✅ **Step 1: Generate OTP**
    //     const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    //     console.log('🔢 Generated OTP:', otp); // Log OTP before hashing

    //     if (!otp) {
    //         console.log('🚨 ERROR: OTP is undefined!');
    //         throw new Error('OTP generation failed.');
    //     }

    //     const otpHash = await bcrypt.hash(otp, 10); // Hash OTP
    //     const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    //     user.otp = otpHash; // Store Hashed OTP
    //     user.otpExpires = otpExpires;

    //     await this.userRepository.save(user);

    //     // ✅ **Step 2: Send OTP to User Email**
    //     await this.mailService.sendOtpEmail(user.email, otp);

    //     return {
    //         message: 'OTP sent to your email. Please verify OTP to continue.',
    //     };
    // }

    async verifyOtp(email: string, otp: string) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new NotFoundException('User not found.');

        console.log('🔍 Verifying OTP for:', email);
        console.log('🔑 Entered OTP:', otp);
        console.log('🔒 Stored OTP Hash:', user.otp);

        // ✅ **Step 1: Check if OTP exists and is not expired**
        if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
            console.log('🚨 OTP expired or missing.');
            throw new BadRequestException(
                'OTP expired. Please request a new one.',
            );
        }

        // ✅ **Step 2: Compare OTP**
        const isOtpValid = await bcrypt.compare(otp, user.otp);
        console.log('✅ OTP Match Result:', isOtpValid);

        if (!isOtpValid) {
            console.log('🚨 Incorrect OTP for:', email);
            throw new BadRequestException('Invalid OTP.');
        }

        // ✅ **Step 3: Clear OTP after successful verification**
        user.otp = null;
        user.otpExpires = null;
        await this.userRepository.save(user);

        const { password, ...userWithoutPassword } = user;

        // ✅ **Step 4: If User Has a Temporary Password, Force Password Change**
        if (user.isTemporaryPassword) {
            return {
                isTemporaryPassword: true,
                message:
                    'You must change your password before accessing the system.',
            };
        }

        // ✅ **Step 5: Generate JWT Token for Normal Login**
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtTokenUtil.generateToken(payload);

        return {
            message: 'Login successful.',
            user: userWithoutPassword,
            access_token: accessToken,
        };
    }

    async changePassword(dto: ChangePasswordDto) {
        const { email, newPassword, confirmPassword } = dto;

        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new NotFoundException('User not found.');

        console.log('🔑 Changing password for:', email);

        // **STEP 1: Check if user is required to change password**
        if (!user.isTemporaryPassword) {
            console.log('🚨 User is not required to change password.');
            throw new BadRequestException('Password change is not required.');
        }

        // **STEP 2: Verify Old Password**
        // const isOldPasswordValid = await this.securityUtil.verifyPassword(
        //     oldPassword,
        //     user.password,
        // );

        // if (!isOldPasswordValid) {
        //     console.log('🚨 Old password is incorrect.');
        //     throw new BadRequestException('Incorrect old password.');
        // }

        // **STEP 3: Check if new passwords match**
        if (newPassword !== confirmPassword) {
            console.log('🚨 New passwords do not match.');
            throw new BadRequestException('New passwords do not match.');
        }

        // **STEP 4: Hash New Password**
        const hashedPassword =
            await this.securityUtil.hashPassword(newPassword);

        // **STEP 5: Update User Password and Set `isTemporaryPassword = false`**
        user.password = hashedPassword;
        user.isTemporaryPassword = false;

        await this.userRepository.save(user);

        console.log('✅ Password changed successfully for:', email);

        return {
            message: 'Password changed successfully. You can now log in.',
        };
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const { email } = dto;
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new NotFoundException('User not found.');

        console.log('🔵 Sending OTP for password reset to:', email);

        // ✅ Generate a 6-digit OTP
        const otp = randomInt(100000, 999999).toString();
        console.log('🔢 Generated OTP:', otp);

        // ✅ Hash OTP before storing it
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpires = addMinutes(new Date(), 5); // OTP expires in 5 minutes

        user.otp = otpHash;
        user.otpExpires = otpExpires;
        await this.userRepository.save(user);

        // ✅ Send OTP Email
        await this.mailService.sendOtpEmail(user.email, otp);

        return {
            message:
                'OTP sent to your email. Please verify OTP to reset your password.',
        };
    }

    // async register(registerDto: UserRegisterDto): Promise<User> {
    //     const {
    //         email,
    //         username,
    //         role,
    //         departments,
    //         languages,
    //         language,
    //         managerId,
    //     } = registerDto;

    //     const existingUser = await this.userRepository.findByEmail(email);
    //     if (existingUser) throw new BadRequestException('User already exists');

    //     // ✅ Generate a temporary password
    //     const temporaryPassword = Math.random().toString(36).slice(-8);
    //     console.log('🔑 Generated Temporary Password:', temporaryPassword);

    //     // ✅ Ensure password is hashed only once
    //     const hashedPassword =
    //         await this.securityUtil.hashPassword(temporaryPassword);
    //     console.log('🔒 Hashed Password to Store:', hashedPassword);

    //     let manager: User | undefined;
    //     if (role === Role.AGENT) {
    //         manager = await this.userRepository.findById(managerId);
    //         if (!manager) throw new BadRequestException('Manager not found');
    //     }

    //     // ✅ Store the hashed password
    //     const user = await this.userRepository.createUser({
    //         email,
    //         username,
    //         password: hashedPassword, // Ensure it's hashed only once
    //         role,
    //         departments: role === Role.MANAGER ? departments : undefined,
    //         languages: role === Role.MANAGER ? languages : undefined,
    //         language: role === Role.AGENT ? language : undefined,
    //         manager,
    //         isTemporaryPassword: true,
    //     });

    //     // ✅ Send email with the **correct** temporary password
    //     await this.mailService.sendRegistrationEmail(
    //         email,
    //         role,
    //         temporaryPassword,
    //     );

    //     return user;
    // }

    async register(userDto: any): Promise<any> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByUsername(
            userDto.username,
        );
        if (existingUser) {
            throw new Error('User already exists with that username');
        }

        // Check if email already exists
        const existingEmail = await this.userRepository.findByEmail(
            userDto.email,
        );

        if (existingEmail) {
            throw new Error('User already exists with that email');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(userDto.password, 10);

        // Generate 2FA secret for the new user
        const secret = this.authenticatorService.generateSecret(
            userDto.username,
        );

        // Generate the QR Code URL using the secret
        const qrCodeUrl = `otpauth://totp/${userDto.username}?secret=${secret.base32}&issuer=${COMPANY_NAME}`;

        // Create a new user entity based on the role
        const newUser = new User();
        newUser.username = userDto.username;
        newUser.email = userDto.email;
        newUser.password = hashedPassword;
        newUser.role = userDto.role;
        newUser.isTemporaryPassword = true;
        newUser.departments = userDto.departments || [];
        newUser.languages = userDto.languages || [];
        newUser.language = userDto.language;
        newUser.twoFASecret = secret.base32; // Save the 2FA secret

        // If the user is an agent, associate with a manager
        if (userDto.role === 'agent') {
            if (!userDto.managerId) {
                throw new Error('Manager ID is required for agents.');
            }
            const manager = await this.userRepository.findById(
                userDto.managerId,
            );
            if (!manager || manager.role !== 'manager') {
                throw new Error('Manager not found.');
            }
            newUser.manager = manager; // Assign the manager to the agent
        }

        // Save the user
        const savedUser = await this.userRepository.save(newUser);

        // Return the created user and the QR code URL
        return {
            user: savedUser,
            qrCodeUrl, // Provide the QR code URL for the user to scan
            secret: secret.base32, // Secret to store temporarily
        };
    }

    // Step 3: Verify 2FA Token
    async verify2FAToken(username: string, token: string): Promise<any> {
        const user = await this.userRepository.findByUsername(username); // Fetch user from DB
        if (!user) throw new NotFoundException('User not found');

        // Check if the token matches
        const isValid = await this.authenticatorService.verifyToken(
            user.twoFASecret,
            token,
        );
        if (!isValid) {
            throw new Error('Invalid token');
        }

        // generate jwt token
        const jwt_secret = this.jwtTokenUtil.generateToken(user);

        // Enable 2FA and mark the user as verified
        user.is2FAEnabled = true;
        user.twoFAVerified = true;
        await this.userRepository.save(user);

        return jwt_secret;
    }

    async check2FACode(username: string, token: string) {
        const user = await this.userRepository.findByUsername(username); // Fetch user from DB
        if (!user) throw new NotFoundException('User not found');

        // Check if the token matches
        const isValid = await this.authenticatorService.verifyToken(
            user.twoFASecret,
            token,
        );
        if (!isValid) {
            throw new Error('Invalid token');
        }

        return isValid;
    }

    async login(username: string, token: string): Promise<any> {
        // 1. Find user by username
        const user = await this.userRepository.findByUsername(username);

        if (!user) {
            throw new NotFoundException('Admin not found');
        }

        const secret = this.authenticatorService.generateSecret(user.username);

        // Generate the QR code URL that the authenticator app can use
        const qrCodeUrl = `otpauth://totp/${user.username}?secret=${secret.base32}&issuer=${COMPANY_NAME}`;

        // Generate the QR code image buffer (PNG format)
        const qrCodeBuffer = await this.authenticatorService.generateQrCode(
            qrCodeUrl,
            user.username,
        );

        // 3. Generate JWT token if everything is valid
        const jwtToken = await this.jwtTokenUtil.generateToken(user);

        return {
            message: 'Login successful',
            access_token: jwtToken, // Return the JWT token for further authentication
        };
    }

    async updateAdminUsernames(username: string) {
        const admin =
            await this.userRepository.findByUsernameAndAdmin(username);

        console.log('🔍 Found admin:', admin);
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        // generate qrCode with username and password
        const secret = this.authenticatorService.generateSecret(admin.username);

        // Generate the QR code URL that the authenticator app can use
        const qrCodeUrl = `otpauth://totp/${admin.username}?secret=${secret.base32}&issuer=${COMPANY_NAME}`;

        const qrCodeBuffer = await this.authenticatorService.generateQrCode(
            qrCodeUrl,
            admin.username,
        );

        // Save the generated secret in the database for the user
        admin.twoFASecret = secret.base32;
        await this.userRepository.save(admin); // Save the user with the updated secret

        // Step 1: Upload the QR code buffer to S3
        const s3 = this.s3ConfigService.getS3Instance();
        const bucketName = this.s3ConfigService.getBucketName();
        const fileName = `${admin.username}-qrcode.png`; // Customize the file name as needed

        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: qrCodeBuffer, // The QR code image buffer
            ContentType: 'image/png', // Content type of the image
            ACL: 'public-read', // Optional, make the file publicly accessible
        };

        try {
            // Upload the QR code image to S3
            const uploadResult = await s3.upload(uploadParams).promise();
            const qrCodeUrlInS3 = uploadResult.Location; // The public URL of the uploaded image

            // Step 2: Return the QR code URL and the secret to frontend
            return {
                // qrCodeBuffer, // The QR code image buffer (useful if you want to send it as a response)
                qrCodeUrlInS3, // The URL of the uploaded QR code image on S3
                secret: secret.base32, // The 2FA secret for saving in the user's profile
                qrCodeUrl, // The URL for the authenticator app (otpauth:// link)
            };
        } catch (error) {
            throw new Error('Error uploading to S3: ' + error.message);
        }
    }

    // ####################### admin flow #######################

    // admin log in flow
    async adminLogin(dto: AdminLoginDto): Promise<any> {
        // 1. Find user by username
        const user = await this.userRepository.findByUsernameAndAdmin(
            dto.username,
        );
        if (!user) {
            throw new NotFoundException('Admin not found');
        }

        // check password
        const isPasswordValid = await this.securityUtil.verifyPassword(
            dto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new BadRequestException('Invalid credentials');
        }

        console.log('🔍 Found user:', user);
        if (!user) {
            throw new NotFoundException('Admin not found');
        }

        return {
            message: 'Login successful',
            username: user.username,
        };
    }

    // change username
    async changeUsername(chnageUsernameDto: ChangeUsernameDto): Promise<any> {
        const user = await this.userRepository.findByUsername(
            chnageUsernameDto.oldUsername,
        );

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.username = chnageUsernameDto.newUsername;

        await this.userRepository.save(user);
        return this.generate2FASecret(chnageUsernameDto.newUsername);
    }

    // generate 2FA secret
    async generate2FASecret(username: string): Promise<any> {
        const user = await this.userRepository.findByUsername(username); // Fetch user from DB
        console.log('🔍 Found user:', user, !user);
        if (!user) throw new ResourceNotFoundException('User not found');

        // Generate a new 2FA secret for the user
        const secret = this.authenticatorService.generateSecret(user.username);

        // Generate the QR code URL that the authenticator app can use
        const qrCodeUrl = `otpauth://totp/${user.username}?secret=${secret.base32}&issuer=${COMPANY_NAME}`;

        // Generate the QR code image buffer (PNG format)
        const qrCodeBuffer = await this.authenticatorService.generateQrCode(
            qrCodeUrl,
            user.username,
        );

        // Save the generated secret in the database for the user
        user.twoFASecret = secret.base32;
        await this.userRepository.save(user); // Save the user with the updated secret

        // return qrCodeBuffer;

        // // Step 1: Upload the QR code buffer to S3
        // const s3 = this.s3ConfigService.getS3Instance();
        // const bucketName = this.s3ConfigService.getBucketName();
        // const fileName = `${user.username}-qrcode.png`; // Customize the file name as needed

        // const uploadParams = {
        //     Bucket: bucketName,
        //     Key: fileName,
        //     Body: qrCodeBuffer, // The QR code image buffer
        //     ContentType: 'image/png', // Content type of the image
        //     ACL: 'public-read', // Optional, make the file publicly accessible
        // };

        // // Upload the QR code image to S3
        // const uploadResult = await s3.upload(uploadParams).promise();
        // const qrCodeUrlInS3 = uploadResult.Location; // The public URL of the uploaded image

        // // Step 2: Return the QR code URL and the secret to frontend
        return {
            qrCodeBuffer, // The QR code image buffer (useful if you want to send it as a response)
            // qrCodeUrlInS3, // The URL of the uploaded QR code image on S3
            secret: secret.base32, // The 2FA secret for saving in the user's profile
            qrCodeUrl, // The URL for the authenticator app (otpauth:// link)
        };
    }

    async checkUserIsActive(username: string): Promise<any> {
        const user = await this.userRepository.findByUsername(username);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            isActive: user.isActive
                ? `Your account is active`
                : `Your account is not active`,
        };
    }

    async userActivation(username: string): Promise<any> {
        const user = await this.userRepository.findByUsername(username);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.isRequested = true;
        await this.userRepository.save(user);

        return {
            message: 'User activated request successfully',
        };
    }

    async lostDevice(username: string): Promise<any> {
        const user = await this.userRepository.findByUsername(username);

        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.isRequested = true;

        await this.userRepository.save(user);

        return {
            message: 'User lost device request successfully',
        };
    }

    async forgotUsername(email: string): Promise<any> {
        const user = await this.userRepository.findByEmail(email);

        console.log('🔍 Found user:', user);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.isRequested = true;
        await this.userRepository.save(user);

        return {
            message: 'User forgot username request successfully',
        };
    }

    // active

    async activeAccount(username: string): Promise<any> {
        const user = await this.userRepository.findByUsername(username);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isActive) {
            throw new BadRequestException('User account is already active');
        }

        user.isActive = true;
        user.isRequested = false;
        await this.userRepository.save(user);

        return {
            message: `User account activated successfully with this username '${username}'`,
        };
    }

    // ADMIN ACCESS
    async deleteUser(
        username: string,
        checkTotpDto: CheckTotpDto,
    ): Promise<any> {
        const user = await this.userRepository.findByUsername(username);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // check TOTP

        const verified = await this.check2FACode(
            checkTotpDto.username,
            checkTotpDto.token,
        );

        if (!verified) {
            throw new BadRequestException('Invalid TOTP token');
        }

        await this.userRepository.delete({ id: user.id });

        return {
            message: `User with username '${username}' deleted successfully`,
        };
    }

    async getUserDetails(username: string): Promise<any> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
