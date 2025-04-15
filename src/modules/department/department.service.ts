// src/department/department.service.ts
import { Injectable } from '@nestjs/common';
import { PageRequest } from 'src/common/dto/page-request.dto';
import { createPaginatedResponse } from 'src/common/dto/pagination.dto';
import {
    ResourceAlreadyExistException,
    ResourceNotFoundException,
} from 'src/exceptions';
import { SecurityUtil } from 'src/utils/security.util';
import { DepartmentRepository } from './department.repository';
import { DepartmentSpecification } from './department.specification';
import { Department } from './entity/department.entity';

@Injectable()
export class DepartmentService {
    constructor(
        private readonly departmentRepository: DepartmentRepository,
        private readonly securityUtils: SecurityUtil,
    ) {}

    async create(name: string): Promise<Department> {
        const loggedInUser = await this.securityUtils.getLoggedInUser();
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

    async findAll(name: string, isActive: boolean, pagerequest: PageRequest) {
        // const loggedInUser = await this.securityUtils.getLoggedInUser();
        const queryBuilder =
            this.departmentRepository.createQueryBuilder('department');

        // const loggedInUser = await this.securityUtils.getLoggedInUser();

        DepartmentSpecification.distinctFaqs(queryBuilder);
        DepartmentSpecification.matchName(queryBuilder, name);
        DepartmentSpecification.matchStatus(queryBuilder, isActive);

        const [departments, total] = await queryBuilder
            .orderBy('department.id', 'DESC')
            .getManyAndCount();

        return createPaginatedResponse(departments, total, pagerequest);
    }

    async findOne(id: number): Promise<Department> {
        const loggedInUser = await this.securityUtils.getLoggedInUser();
        return this.departmentRepository.findOne({ where: { id } });
    }

    async update(id: number, name: string): Promise<Department> {
        const loggedInUser = await this.securityUtils.getLoggedInUser();
        const department = await this.departmentRepository.findById(id);
        if (!department) {
            throw new Error('Department not found');
        }
        department.name = name;
        return this.departmentRepository.save(department);
    }

    async remove(id: number) {
        const loggedInUser = await this.securityUtils.getLoggedInUser();
        const department = await this.departmentRepository.findById(id);
        if (!department) {
            throw new Error('Department not found');
        }
        return {
            message: 'Department deleted successfully',
        };
    }

    async updateStatus(id: number, isActive: boolean) {
        const loggedInUser = await this.securityUtils.getLoggedInUser();
        const department = await this.departmentRepository.findById(id);

        if (!department) {
            throw new ResourceNotFoundException('Department not found');
        }
        department.isActive = isActive;
        return this.departmentRepository.save(department);
    }
}
