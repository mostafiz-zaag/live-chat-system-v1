import { Injectable } from '@nestjs/common';
import { AgentStatus, Role } from 'src/enums/user-role';
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

    async findByUsername(username: string): Promise<User | null> {
        const user = await this.findOne({ where: { username } });
        return user ? user : null; // Ensure it returns null if not found
    }

    async findByUsernameAndAdmin(username: string): Promise<User | null> {
        return this.findOne({
            where: {
                username,
                role: Role.ADMIN, // Check if the role is admin
            },
        });
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

    async allRequestForActiveUsers() {
        return this.find({ where: { isRequested: true } });
    }

    // UserRepository.ts
    // ✅ CORRECTED QUERY
    async findReadyMatchingAgent(
        language: string,
        department: string,
    ): Promise<User | null> {
        return this.createQueryBuilder('user')
            .where('user.role = :role', { role: Role.AGENT })
            .andWhere('user.isActive = :status', { status: true }) // Ensure the agent is active
            .andWhere(':language = ANY(user.languages)', { language }) // Correct syntax
            .andWhere(':department = ANY(user.departments)', { department }) // Correct syntax
            .getOne();
    }

    async findAllReadyAgents(): Promise<User[]> {
        return this.find({
            where: { role: Role.AGENT, status: AgentStatus.READY },
        });
    }

    async updateAgentStatus(agentId: number, status: AgentStatus) {
        return this.update({ id: agentId, role: Role.AGENT }, { status });
    }

    // user.repository.ts
    async findReadyUnassignedAgent(
        language: string,
        department: string,
    ): Promise<User | null> {
        return this.createQueryBuilder('user')
            .where('user.role = :role', { role: Role.AGENT })
            .andWhere('user.status = :status', { status: AgentStatus.READY })
            .andWhere(':language = ANY(user.languages)', { language })
            .andWhere('user.isAssigned = :assigned', { assigned: false })
            .andWhere(':department = ANY(user.departments)', { department })
            .getOne();
    }
}
