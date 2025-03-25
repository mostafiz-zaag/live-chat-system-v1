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
        return this.findOne({ where: { username } });
    }

    async findByUsernameAndAdmin(username: string): Promise<User | null> {
        return this.findOne({ where: { username, role: Role.ADMIN } });
    }

    async createUser(userData: Partial<User>): Promise<User> {
        const user = this.create(userData);
        return this.save(user);
    }

    async getAgentsByManagerId(managerId: number): Promise<User[]> {
        return this.find({
            where: { manager: { id: managerId } },
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

    async findReadyMatchingAgent(
        language: string,
        department: string,
    ): Promise<User | null> {
        return this.createQueryBuilder('user')
            .where('user.role = :role', { role: Role.AGENT })
            .andWhere('user.status = :status', { status: AgentStatus.READY })
            .andWhere(':language = ANY(user.languages)', { language })
            .andWhere(':department = ANY(user.departments)', { department })
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

    async findReadyUnassignedAgent(
        language: string,
        department: string,
    ): Promise<User | null> {
        return this.createQueryBuilder('user')
            .where('user.role = :role', { role: Role.AGENT })
            .andWhere('user.status = :status', { status: AgentStatus.READY })
            .andWhere(':language = ANY(user.languages)', { language })
            .andWhere(':department = ANY(user.departments)', { department })
            .andWhere('user.isAssigned = :assigned', { assigned: false })
            .getOne();
    }

    async findReadyAgent(): Promise<User | null> {
        return this.findOne({
            where: {
                role: Role.AGENT,
                status: AgentStatus.READY,
                isAssigned: false,
            },
        });
    }

    async getAllManagers(): Promise<User[]> {
        return this.find({
            where: { role: Role.MANAGER },
            relations: ['agents'],
        });
    }
}
