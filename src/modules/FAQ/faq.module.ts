import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqController } from './faq.controller';
import { Faq } from './faq.entity';
import { FaqService } from './faq.service';
import { FaqRepository } from './faq.repository';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [TypeOrmModule.forFeature([Faq]), CommonModule], // Add your entities here
    controllers: [FaqController],
    providers: [FaqService, FaqRepository],
    exports: [FaqService],
})
export class FaqModule {}
