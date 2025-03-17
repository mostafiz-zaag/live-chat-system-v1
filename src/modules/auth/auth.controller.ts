import {
    Body,
    Controller,
    HttpCode,
    Post,
    UnauthorizedException,
} from '@nestjs/common';
import { UserRegisterDto } from '../user/dto/user-register.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    @HttpCode(200)
    @Post('/login')
    async login(@Body() loginDto: LoginDto) {
        console.log('USer ----------- ');
        const user = await this.authService.validateUser(
            loginDto.email,
            loginDto.password,
        );
        if (!user) throw new UnauthorizedException('Invalid credentials');
        return this.authService.login(user);
    }

    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ADMIN)
    @Post('/register')
    async register(@Body() registerDto: UserRegisterDto) {
        return this.authService.register(registerDto);
    }
}
