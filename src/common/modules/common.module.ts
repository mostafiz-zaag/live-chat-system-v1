import { Module } from '@nestjs/common';
import { CustomLoggerService } from '../../logging/logger.service';
import { SecurityUtil } from '../../utils/security.util';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenUtil } from '../../utils/jwt-token.util';

@Module({
    providers: [CustomLoggerService, SecurityUtil, JwtService, JwtTokenUtil],
    exports: [CustomLoggerService, SecurityUtil, JwtService, JwtTokenUtil],
})
export class CommonModule {}
