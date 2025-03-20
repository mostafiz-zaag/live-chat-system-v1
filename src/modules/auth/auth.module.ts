import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from 'src/mail/mail.module';
import { AuthenticatorService } from 'src/security/authenticator.service';
import { CommonModule } from '../common/common.module';
import { S3ConfigService } from '../config/s3.config';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [PassportModule, UserModule, CommonModule, MailModule],
    providers: [
        AuthService,
        JwtStrategy,
        AuthenticatorService,
        S3ConfigService,
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
