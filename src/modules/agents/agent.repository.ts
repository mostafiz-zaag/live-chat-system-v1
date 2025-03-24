// import { Injectable } from '@nestjs/common';
// import { DataSource, Repository } from 'typeorm';
// import { Agent } from './entities/agent.entity';

// @Injectable()
// export class AgentRepository extends Repository<Agent> {
//     constructor(private readonly dataSource: DataSource) {
//         super(Agent, dataSource.createEntityManager());
//     }

//     async findByName(name: string): Promise<Agent | null> {
//         return this.findOne({ where: { name } });
//     }

//     async findById(agentId: string): Promise<Agent | null> {
//         return this.findOne({ where: { agentId } });
//     }

//     async findAllReadyAgents(): Promise<Agent[]> {
//         return this.find({ where: { status: 'ready' } });
//     }

//     async updateAgentStatus(agentId: string, status: 'ready' | 'busy'): Promise<void> {
//         await this.update({ agentId }, { status });
//     }

//     async createAgent(agent: Partial<Agent>): Promise<Agent> {
//         const newAgent = this.create(agent);
//         return await this.save(newAgent);
//     }

//     async findByStatus(status: 'ready' | 'busy'): Promise<Agent | null> {
//         return this.findOne({ where: { status } });
//     }
// }
