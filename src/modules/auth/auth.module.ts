import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [PassportModule, UserModule, CommonModule],
    providers: [AuthService, JwtStrategy, UserService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
