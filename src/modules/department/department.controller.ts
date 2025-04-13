// src/department/department.controller.ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { API_SECURED_PREFIX } from 'src/constants/project.constant';
import { DepartmentService } from './department.service';
import { Department } from './entity/department.entity';

@Controller(`${API_SECURED_PREFIX}/departments`)
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) {}

    // Create a new department
    @Post('/create')
    async create(@Body('name') name: string): Promise<Department> {
        return this.departmentService.create(name);
    }

    // Get all departments
    @Get()
    async findAll(): Promise<Department[]> {
        return this.departmentService.findAll();
    }

    // Get a department by ID
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<Department> {
        return this.departmentService.findOne(id);
    }

    // Update a department
    @Put(':id')
    async update(
        @Param('id') id: number,
        @Body('name') name: string,
    ): Promise<Department> {
        return this.departmentService.update(id, name);
    }

    // Delete a department
    @Delete(':id')
    async remove(@Param('id') id: number): Promise<void> {
        return this.departmentService.remove(id);
    }
}
