import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
    constructor(private readonly dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
        return this.findOne({ where: { id } });
    }

    async createUser(userData: Partial<User>): Promise<User> {
        const user = this.create(userData);
        return this.save(user);
    }

    async getAgentsByManagerId(managerId: number): Promise<User[]> {
        return this.find({
            where: {
                manager: { id: managerId },
            },
            relations: ['manager'],
        });
    }

    async emailExists(email: string): Promise<boolean> {
        const count = await this.count({ where: { email } });
        return count > 0;
    }
}
