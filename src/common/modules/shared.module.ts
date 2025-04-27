import { Module } from '@nestjs/common';
import { CommonModule } from './common.module';

@Module({
    imports: [CommonModule],
    providers: [],
    exports: [],
})
export class SharedModule {}
