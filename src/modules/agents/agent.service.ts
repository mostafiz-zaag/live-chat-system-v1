import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RoomRepository } from '../chat/repositories/room.repository';
import { AgentRepository } from './agent.repository';

@Injectable()
export class AgentService {
    constructor(
        @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
        private readonly agentRepository: AgentRepository,
        private readonly roomRepository: RoomRepository,
    ) {}

    async joinQueue(agentName: string) {
        let agent = await this.agentRepository.findByName(agentName);
        if (!agent) {
            throw new NotFoundException(
                `No agent found with the name: ${agentName}`,
            );
        }

        await this.agentRepository.updateAgentStatus(agent.agentId, 'ready');

        // Find an unassigned room
        let assignedRoom = await this.roomRepository.findUnassignedRoom();
        if (assignedRoom) {
            await this.roomRepository.assignAgentToRoom(
                assignedRoom.id,
                agent.agentId,
            );
            await this.agentRepository.updateAgentStatus(agent.agentId, 'busy');

            await this.natsClient
                .emit('agent.assigned', {
                    agentId: agent.agentId,
                    roomId: assignedRoom.id,
                    agentName: agent.name,
                })
                .toPromise();
        }

        const readyAgents = await this.agentRepository.findAllReadyAgents();
        return {
            message: assignedRoom
                ? `Agent "${agentName}" assigned to Room ${assignedRoom.id}.`
                : `Agent "${agentName}" is now ready.`,
            assignedRoom,
            totalReadyAgents: readyAgents.length,
            readyAgents,
        };
    }

    async finishChat(agentId: string) {
        let agent = await this.agentRepository.findById(agentId);
        if (!agent) {
            throw new NotFoundException(
                `No agent found with the ID: ${agentId}`,
            );
        }

        await this.agentRepository.updateAgentStatus(agentId, 'ready');

        let assignedRoom = await this.roomRepository.findUnassignedRoom();
        if (assignedRoom) {
            await this.roomRepository.assignAgentToRoom(
                assignedRoom.id,
                agentId,
            );

            await this.natsClient
                .emit('agent.assigned', {
                    agentId,
                    roomId: assignedRoom.id,
                })
                .toPromise();
        }

        const readyAgents = await this.agentRepository.findAllReadyAgents();
        return {
            message: assignedRoom
                ? `Agent ${agentId} finished chat and reassigned to Room ${assignedRoom.id}.`
                : `Agent ${agentId} is now ready.`,
            assignedRoom,
            totalReadyAgents: readyAgents.length,
            readyAgents,
        };
    }

    async getAllReadyAgents() {
        const readyAgents = await this.agentRepository.findAllReadyAgents();
        return {
            totalReadyAgents: readyAgents.length,
            readyAgents,
        };
    }

    async getAllAgents() {
        const agents = await this.agentRepository.find();
        return {
            totalAgents: agents.length,
            agents,
        };
    }

    async markAgentBusy(agentId: string) {
        const agent = await this.agentRepository.findById(agentId);
        if (!agent) {
            return { message: `Agent ${agentId} not found.` };
        }
        await this.agentRepository.updateAgentStatus(agentId, 'busy');
        return { message: `Agent ${agentId} marked as busy.` };
    }

    async getAgentById(agentId: string) {
        return await this.agentRepository.findById(agentId);
    }

    async updateAgentStatus(agentId: string, status: 'ready' | 'busy') {
        const agent = await this.agentRepository.findById(agentId);
        if (!agent) {
            return { message: `Agent ${agentId} not found.` };
        }
        await this.agentRepository.updateAgentStatus(agentId, status);
        return { message: `Agent ${agentId} status updated to ${status}.` };
    }

    async getNextAvailableAgent() {
        return this.agentRepository.findOne({ where: { status: 'ready' } });
    }
}
