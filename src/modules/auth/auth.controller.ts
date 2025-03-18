import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { API_PREFIX } from 'src/constants/project.constant';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('/')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/login`)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

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
}
