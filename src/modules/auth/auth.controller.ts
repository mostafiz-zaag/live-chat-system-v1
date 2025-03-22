import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Put,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { API_PREFIX } from 'src/constants/project.constant';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin.login';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
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

    @Post(`${API_PREFIX}/auth/login`)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.username, loginDto.token);
    }

    // FOR ADMIN LOGIN
    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/admin/login`)
    async adminLogin(@Body() loginDto: AdminLoginDto) {
        console.log('loginDto', loginDto);
        return this.authService.adminLogin(loginDto);
    }

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/admin/confirm-username`)
    async comfirmUsername(@Body() chnageUsernameDto: ChangeUsernameDto) {
        return this.authService.changeUsername(chnageUsernameDto);
    }

    @HttpCode(200)
    @Post(`${API_PREFIX}/verify-2fa`)
    async verify2FA(
        @Body('username') username: string,
        @Body('token') token: string,
    ) {
        const isVerified = await this.authService.verify2FAToken(
            username,
            token,
        );
        return isVerified
            ? {
                  message: '2FA activated successfully',
                  access_token: isVerified,
              }
            : { message: 'Invalid 2FA token' };
    }

    // check user is active or not
    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/check-user`)
    async checkUser(@Body('username') username: string) {
        return this.authService.checkUserIsActive(username);
    }

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/user-activation-request`)
    async userActivation(@Body('username') username: string) {
        return this.authService.userActivation(username);
    }

    @HttpCode(200)
    @Get(`${API_PREFIX}/auth/user-activation-request-list`)
    async userActivationList() {
        return await this.userService.allRequestForActiveUsers();
    }

    // Lost my device

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/lost-device`)
    async lostDevice(@Body('username') username: string) {
        return this.authService.lostDevice(username);
    }

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/forgot-username`)
    async forgotUsername(@Body('email') email: string) {
        return this.authService.forgotUsername(email);
    }

    // Account active
    @HttpCode(200)
    @Put(`${API_PREFIX}/auth/active-account`)
    async activeAccount(@Body('username') username: string) {
        return this.authService.activeAccount(username);
    }
}
