import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Role } from 'src/enums/user-role';
import { MailService } from 'src/mail/mail.service';
import { JwtTokenUtil } from '../../utils/jwt-token.util';
import { SecurityUtil } from '../../utils/security.util';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
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
        console.log('USET ---------------- ', user);
        if (!user) return null; // User not found

        // Check password using bcrypt
        const isPasswordValid = await this.securityUtil.verifyPassword(
            password,
            user.password,
        );

        console.log('is password ', isPasswordValid);
        if (!isPasswordValid) return null;

        return user;
    }

    async login(dto: LoginDto) {
        const { email, password } = dto;

        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new NotFoundException('User not found.');

        const isPasswordValid = await this.securityUtil.verifyPassword(
            password,
            user.password,
        );

        console.log('isvalid pass ', isPasswordValid);
        if (!isPasswordValid)
            throw new BadRequestException('Invalid credentials.');

        // **STEP 1: Force Users to Change Temporary Password Before OTP**
        if (
            (user.role === Role.MANAGER || user.role === Role.AGENT) &&
            user.isTemporaryPassword
        ) {
            return {
                isTemporaryPassword: true,
                message:
                    'You must change your password before accessing the system.',
            };
        }

        // **STEP 2: Generate and Hash OTP Before Storing**
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const otpHash = await bcrypt.hash(otp, 10); // Hash OTP
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 mins

        user.otp = otpHash; // Store Hashed OTP
        user.otpExpires = otpExpires;

        await this.userRepository.save(user);

        // **STEP 3: Send OTP via Email**
        await this.mailService.sendOtpEmail(user.email, otp);

        return {
            message: 'OTP sent to your email. Please verify OTP to continue.',
        };
    }

    async verifyOtp(email: string, otp: string) {
        const user = await this.userRepository.findByEmail(email);

        if (!user) throw new NotFoundException('User not found.');

        // **STEP 1: Ensure OTP Exists & Hasn't Expired**
        if (!user.otp || user.otpExpires < new Date()) {
            user.otp = null; // Clear expired OTP
            user.otpExpires = null;
            await this.userRepository.save(user);
            throw new BadRequestException('OTP expired or invalid.');
        }

        // **STEP 2: Compare Entered OTP with Hashed OTP**
        const isOtpValid = await bcrypt.compare(otp, user.otp);
        if (!isOtpValid) throw new BadRequestException('Incorrect OTP.');

        // **STEP 3: OTP is Valid → Clear OTP Fields**
        user.otp = null;
        user.otpExpires = null;
        await this.userRepository.save(user);

        // **STEP 4: Generate JWT Token**
        const payload = { sub: user.id, email: user.email, role: user.role };

        return {
            access_token: this.jwtTokenUtil.generateToken(payload),
            message: 'Login successful.',
        };
    }

    async register(registerDto: UserRegisterDto): Promise<User> {
        const {
            email,
            username,
            role,
            departments,
            languages,
            language,
            managerId,
        } = registerDto;

        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) throw new BadRequestException('User already exists');

        // Generate a temporary password
        const temporaryPassword = Math.random().toString(36).slice(-8);
        const hashedPassword =
            await this.securityUtil.hashPassword(temporaryPassword);

        let manager: User | undefined;
        if (role === Role.AGENT) {
            manager = await this.userRepository.findById(managerId);
            if (!manager) throw new BadRequestException('Manager not found');
        }

        // Create user
        const user = await this.userRepository.createUser({
            email,
            username,
            password: hashedPassword,
            role,
            departments: role === Role.MANAGER ? departments : undefined, // Only managers have multiple departments
            languages: role === Role.MANAGER ? languages : undefined, // Only managers have multiple languages
            language: role === Role.AGENT ? language : undefined, // Only agents have a single language
            manager,
            isTemporaryPassword: true,
        });

        // Send email with login credentials
        await this.mailService.sendRegistrationEmail(
            email,
            role,
            temporaryPassword,
        );

        return user;
    }
}
