import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { API_PREFIX, API_SECURED_PREFIX } from 'src/constants/project.constant';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin.login';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { CheckTotpDto } from './dto/check-totp.dto';
import { ForgotUserNameDto } from './dto/forgot-username.dto';
import { LoginDto } from './dto/login.dto';
import { LostMyDeviceDto } from './dto/lost-my-device.dto';
import { PageRequest } from '../../common/dto/page-request.dto';
import { UserRequestType } from '../../enums/user-request-type.enum';

@Controller(`/`)
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
    @Post(`${API_SECURED_PREFIX}/auth/register`)
    async register(@Body() registerDto: UserRegisterDto) {
        return this.authService.register(registerDto);
    }

    // @Post(`${API_PREFIX}/auth/create-admin`)
    // async createAdmin() {
    //     return this.authService.createAdmin('admin', 'admin@123');
    // }

    // @HttpCode(200) // Ensure response is 200 OK
    // @Post(`${API_PREFIX}/auth/verify-otp`)
    // async verifyOtp(@Body() dto: VerifyOtpDto) {
    //     return this.authService.verifyOtp(dto.email, dto.otp);
    // }

    // @HttpCode(200)
    // @Post(`${API_PREFIX}/auth/change-password`)
    // async changePassword(@Body() dto: ChangePasswordDto) {
    //     return this.authService.changePassword(dto);
    // }

    // @HttpCode(200)
    // @Post('/forgot-password')
    // async forgotPassword(@Body() email: ForgotPasswordDto) {
    //     return this.authService.forgotPassword(email);
    // }

    // google authentification

    // Endpoint to generate 2FA secret and return the QR code URL
    @Get(`${API_PREFIX}/auth/generate-2fa/:username`)
    async generate2FA(@Param('username') username: string, @Res() res: Response) {
        try {
            // Generate the 2FA secret and QR code
            const { secret, qrCodeUrl, qrCodeBuffer } = await this.authService.generate2FASecret(username);

            // res.setHeader('Content-Type', 'image/png');
            // res.setHeader(
            //     'Content-Disposition',
            //     'inline; filename="qrcode.png"',
            // ); // Optional: to suggest a filename

            res.header('secret', secret);

            // Return the QR code URL (hosted on S3) and the secret for frontend usage
            return res.send(qrCodeBuffer.toString('base64')); // Send the QR code image as a base64 string
        } catch (error) {
            res.status(400).json({
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
    async confirmUsername(@Body() changeUsernameDto: ChangeUsernameDto) {
        return this.authService.changeUsername(changeUsernameDto);
    }

    // Login with 2FA
    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/verify-2fa`)
    async verify2FA(@Body('username') username: string, @Body('token') token: string) {
        try {
            // Attempt 2FA verification
            const result = await this.authService.verify2FAToken(username, token);

            return result
                ? {
                      message: '2FA activated successfully',
                      user: result.user,
                      access_token: result.access_token,
                  }
                : { message: 'Invalid 2FA token' };
        } catch (error) {
            throw new BadRequestException(error.message || 'Something went wrong');
        }
    }

    // check user is active or not
    @HttpCode(200)
    @Get(`${API_PREFIX}/auth/check-user/:username`)
    async checkUser(@Param('username') username: string) {
        return this.authService.checkUserIsActive(username);
    }

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/user-activation-request`)
    async userActivationRequest(@Body('username') username: string, @Body('requestedType') requestedType: UserRequestType) {
        return this.authService.userActivationRequest(username, requestedType);
    }

    @HttpCode(200)
    @Get(`${API_PREFIX}/auth/user-request-list`)
    async userActivationList(@Query('requestedType') requestedType: string, @Query('page') page: number, @Query('size') size: number) {
        return await this.userService.allRequestForActiveUsers(requestedType, new PageRequest(page, size));
    }

    @HttpCode(200)
    @Patch(`${API_PREFIX}/auth/request-list/user/:id`)
    async updateRequestStatus(@Param('id') id: number, @Query('accept') accept: boolean) {
        return await this.userService.updateRequestStatus(id, accept);
    }

    // --------------------------Lost my device-----------------------------
    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/lost-device`)
    async lostDevice(@Body() lostMydevice: LostMyDeviceDto) {
        return this.authService.lostDevice(lostMydevice);
    }

    @HttpCode(200)
    @Post(`${API_PREFIX}/auth/forgot-username`)
    async forgotUsername(@Body() forgotUserNameDto: ForgotUserNameDto) {
        console.log('forgotUserNameDto', forgotUserNameDto);
        return this.authService.forgotUsername(forgotUserNameDto);
    }

    // ---------------------------Lost my device-----------------------------

    // Account active
    @HttpCode(200)
    @Patch(`${API_PREFIX}/auth/active-account`)
    async activeAccount(@Body('username') username: string) {
        return this.authService.activeAccount(username);
    }

    // ADMIN ACCESS

    @HttpCode(200)
    @Delete(`${API_PREFIX}/auth/user/delete/:username`)
    async deleteUser(@Param('username') username: string, @Body() checkTotpDto: CheckTotpDto) {
        return this.authService.deleteUser(username, checkTotpDto);
    }

    // see user details
    @HttpCode(200)
    @Get(`${API_PREFIX}/auth/user/:username`)
    async getUserDetails(@Param('username') username: string) {
        return this.authService.getUserDetails(username);
    }
}
