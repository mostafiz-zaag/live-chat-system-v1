// src/department/department.service.ts
import { Injectable } from '@nestjs/common';
import { ResourceAlreadyExistException } from 'src/exceptions';
import { SecurityUtil } from 'src/utils/security.util';
import { DepartmentRepository } from './department.repository';
import { Department } from './entity/department.entity';

@Injectable()
export class DepartmentService {
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly securityUtils: SecurityUtil,
    ) {}

    async create(name: string): Promise<Department> {
        // check if the department already exists
        const existingDepartment = await this.departmentRepository.findOne({
            where: { name },
        });
        if (existingDepartment) {
            throw new ResourceAlreadyExistException(
                'Department already exists',
            );
        }
        const department = this.departmentRepository.create({ name });
        return this.departmentRepository.save(department);
    }

    async findAll(): Promise<Department[]> {
        return this.departmentRepository.find();
    }

    async findOne(id: number): Promise<Department> {
        return this.departmentRepository.findOne({ where: { id } });
    }

    async update(id: number, name: string): Promise<Department> {
        const department = await this.findOne(id);
        if (!department) {
            throw new Error('Department not found');
        }
        department.name = name;
        return this.departmentRepository.save(department);
    }

    async remove(id: number): Promise<void> {
        const department = await this.findOne(id);
        if (!department) {
            throw new Error('Department not found');
        }
        await this.departmentRepository.remove(department);
    }
}
