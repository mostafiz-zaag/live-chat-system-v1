import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { API_PREFIX } from 'src/constants/project.constant';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin.login';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('/')
export class AuthController {
    userRepository: any;
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    // @HttpCode(200)
    // @Post(`${API_PREFIX}/auth/login`)
    // async login(@Body() loginDto: LoginDto) {
    //     return this.authService.login(loginDto);
    // }

    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ADMIN)
    @Post(`${API_PREFIX}/auth/register`)
    async register(@Body() registerDto: UserRegisterDto) {
        return this.authService.register(registerDto);
    }
    @HttpCode(200) // Ensure response is 200 OK
    @Post(`${API_PREFIX}/auth/verify-otp`)
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto.email, dto.otp);
    }

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/change-password`)
    async changePassword(@Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(dto);
    }

    @HttpCode(200)
    @Post('/forgot-password')
    async forgotPassword(@Body() email: ForgotPasswordDto) {
        return this.authService.forgotPassword(email);
    }

    // google authentification

    // Endpoint to generate 2FA secret and return the QR code URL
    @Get(`${API_PREFIX}/generate-2fa/:username`)
    async generate2FA(
        @Param('username') username: string,
        @Res() res: Response,
    ) {
        try {
            // Generate the 2FA secret and QR code
            const { qrCodeUrlInS3, secret, qrCodeUrl } =
                await this.authService.generate2FASecret(username);

            // Return the QR code URL (hosted on S3) and the secret for frontend usage
            return res.json({
                qrCodeUrlInS3, // The URL of the uploaded QR code image on S3
                secret, // The 2FA secret saved in the database
                qrCodeUrl, // The URL to be used in the authenticator app (otpauth:// link)
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error generating 2FA',
                error: error.message,
            });
        }
    }

    // Endpoint to verify the 2FA token and activate the user
    @Post(`${API_PREFIX}/verify-2fa/:username`)
    async verify2FA(
        @Param('username') username: string,
        @Body('token') token: string,
    ) {
        const isVerified = await this.authService.verify2FAToken(
            username,
            token,
        );
        return isVerified
            ? { message: '2FA activated successfully' }
            : { message: 'Invalid 2FA token' };
    }

    @Post(`${API_PREFIX}/auth/login`)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.username, loginDto.token);
    }

    // FOR ADMIN LOGIN
    @Post(`${API_PREFIX}/auth/admin/login`)
    async adminLogin(@Body() loginDto: AdminLoginDto) {
        return this.authService.adminLogin(loginDto);
    }

    @Post(`${API_PREFIX}/auth/admin/confirm-username`)
    async comfirmUsername(@Body('username') username: string) {
        return this.authService.updateAdminUsernames(username);
    }
}
