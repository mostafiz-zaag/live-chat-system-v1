import { Module } from '@nestjs/common';
import { CustomLoggerService } from '../../logging/logger.service';

@Module({
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class CommonModule {}
