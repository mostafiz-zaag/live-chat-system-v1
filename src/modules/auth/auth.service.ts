import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { addMinutes } from 'date-fns';
import { Role } from 'src/enums/user-role';
import { MailService } from 'src/mail/mail.service';
import { JwtTokenUtil } from '../../utils/jwt-token.util';
import { SecurityUtil } from '../../utils/security.util';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtTokenUtil: JwtTokenUtil,
        private readonly securityUtil: SecurityUtil,
        private readonly mailService: MailService,
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

    async login(dto: LoginDto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            console.log('🚨 User not found for email:', dto.email);
            throw new NotFoundException('User not found.');
        }

        console.log('✅ Found user:', user.email);
        console.log('🔒 Stored password hash:', user.password);
        console.log('🔑 Entered password:', dto.password);

        const isPasswordValid = await this.securityUtil.verifyPassword(
            dto.password,
            user.password,
        );

        console.log('🔎 Password Valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('🚨 Invalid password for:', dto.email);
            throw new BadRequestException('Invalid credentials.');
        }

        // ✅ **Step 1: Generate OTP**
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        console.log('🔢 Generated OTP:', otp); // Log OTP before hashing

        if (!otp) {
            console.log('🚨 ERROR: OTP is undefined!');
            throw new Error('OTP generation failed.');
        }

        const otpHash = await bcrypt.hash(otp, 10); // Hash OTP
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        user.otp = otpHash; // Store Hashed OTP
        user.otpExpires = otpExpires;

        await this.userRepository.save(user);

        // ✅ **Step 2: Send OTP to User Email**
        await this.mailService.sendOtpEmail(user.email, otp);

        return {
            message: 'OTP sent to your email. Please verify OTP to continue.',
        };
    }

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

    async register(
        registerDto: UserRegisterDto,
    ): Promise<{ message: string; user: Partial<User> }> {
        const { email, username, role, departments, languages, managerId } =
            registerDto;

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) throw new BadRequestException('User already exists');

        // ✅ Generate a temporary password
        const temporaryPassword = Math.random().toString(36).slice(-8);
        console.log('🔑 Generated Temporary Password:', temporaryPassword);

        // ✅ Hash the password securely
        const hashedPassword =
            await this.securityUtil.hashPassword(temporaryPassword);
        console.log('🔒 Hashed Password to Store:', hashedPassword);

        let manager: User | undefined;
        if (role === Role.AGENT) {
            manager = await this.userRepository.findById(managerId);
            if (!manager) throw new BadRequestException('Manager not found');
        }

        // ✅ Store user with hashed password
        const user = await this.userRepository.createUser({
            email,
            username,
            password: hashedPassword, // Ensure it's hashed only once
            role,
            departments: role === Role.MANAGER ? departments : undefined,
            languages: role === Role.MANAGER ? languages : undefined,
            manager,
            isTemporaryPassword: true,
        });

        // ✅ Send Email Notification
        await this.mailService.sendRegistrationEmail(
            email,
            role,
            temporaryPassword,
        );

        // ✅ Send SMS Notification (If needed)
        // await this.smsService.sendSms(phoneNumber, `Your temporary password is: ${temporaryPassword}`);

        // ✅ Remove password before returning user
        const { password, ...userWithoutPassword } = user;

        return {
            message: 'Register successfully',
            user: userWithoutPassword,
        };
    }
}
