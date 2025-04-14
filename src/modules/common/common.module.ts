import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'src/configs/env.config';
import { CustomLoggerService } from '../../logging/logger.service';
import { JwtTokenUtil } from '../../utils/jwt-token.util';
import { SecurityUtil } from '../../utils/security.util';

@Module({
    imports: [
        JwtModule.register({
            secret: envConfig.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: envConfig.JWT_EXPIRED },
        }),
    ],
    providers: [JwtTokenUtil, SecurityUtil, CustomLoggerService],
    exports: [JwtTokenUtil, SecurityUtil],
})
export class CommonModule {}
