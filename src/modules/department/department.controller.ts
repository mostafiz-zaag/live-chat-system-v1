// src/department/department.controller.ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { PageRequest } from 'src/common/dto/page-request.dto';
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
    async findAll(
        @Query('name') name: string,
        @Query('page') page: number,
        @Query('size') size: number,
        @Query('isActive') isActive: boolean,
    ) {
        return this.departmentService.findAll(
            name,
            isActive,
            new PageRequest(page, size),
        );
    }

    // Get a department by ID
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<Department> {
        return this.departmentService.findOne(id);
    }

    // Update a department
    @Patch('/update')
    async update(
        @Query('id') id: number,
        @Body('name') name: string,
    ): Promise<Department> {
        return this.departmentService.update(id, name);
    }

    // Delete a department
    @Delete(':id')
    async remove(@Param('id') id: number): Promise<void> {
        return this.departmentService.remove(id);
    }

    // upadte status
    @Patch('update/status')
    async updateStatus(
        @Query('id') id: number,
        @Query('isActive') isActive: boolean,
    ): Promise<Department> {
        return this.departmentService.updateStatus(+id, isActive);
    }
}
