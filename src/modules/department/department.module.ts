// src/department/department.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from './department.repository'; // Import repository
import { DepartmentService } from './department.service';
import { Department } from './entity/department.entity';
@Module({
    imports: [TypeOrmModule.forFeature([Department]), CommonModule], // Import entity
    controllers: [DepartmentController],
    providers: [DepartmentService, DepartmentRepository], // Provide repository,
    exports: [DepartmentService], // Export service if needed in other modules
})
export class DepartmentModule {}
