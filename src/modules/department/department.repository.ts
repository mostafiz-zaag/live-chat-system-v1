import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Department } from './entity/department.entity';

@Injectable()
export class DepartmentRepository extends Repository<Department> {
    constructor(private readonly dataSource: DataSource) {
        super(Department, dataSource.createEntityManager());
    }

    async findById(id: number): Promise<Department | null> {
        return this.findOne({ where: { id } });
    }
}
