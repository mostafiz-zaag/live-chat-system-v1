import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AgentStatus, Role } from 'src/enums/user-role';
import { ChatService } from '../chat/chat.service';
import { RoomRepository } from '../chat/repositories/room.repository';
import { NatsService } from '../nats/nats.service';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
    constructor(
        @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
        private readonly chatService: ChatService,
        private readonly natsService: NatsService,
        private readonly userRepository: UserRepository,
        private readonly roomRepository: RoomRepository,
    ) {}

    // user.service.ts
    async requestAssistance(
        userId: string,
        language: string,
        department: string,
    ) {
        const chatRoom = await this.roomRepository.createRoomForUser(
            userId,
            language, // ✅ Store as array
            department, // ✅ Store as array
        );

        const agent = await this.userRepository.findReadyUnassignedAgent(
            language,
            department,
        );

        if (agent) {
            await this.roomRepository.assignAgentToRoom(chatRoom.id, agent.id);
            agent.isAssigned = true;
            await this.userRepository.save(agent);

            return {
                message: `Agent ${agent.username} auto-assigned.`,
                room: chatRoom,
            };
        } else {
            await this.natsClient
                .emit('user.request', {
                    userId,
                    roomId: chatRoom.id,
                    language,
                    department,
                })
                .toPromise();

            return {
                message: 'No unassigned agent available. You have been queued.',
                room: chatRoom,
            };
        }
    }

    async getQueueSize() {
        return await this.chatService.getWaitingUsers();
    }

    async getAllUsers(role?: Role) {
        if (role) {
            return this.userRepository.find({ where: { role } });
        }
        return this.userRepository.find();
    }
    async allRequestForActiveUsers() {
        return await this.userRepository.find({
            where: { isRequested: true },
        });
    }

    async agentJoinQueue(agentName: string) {
        const agent = await this.userRepository.findByUsername(agentName);
        if (!agent) throw new NotFoundException(`${agentName} not found.`);

        if (agent.status === AgentStatus.READY) {
            return {
                message: `Agent: ${agentName} is already ready.`,
            };
        }

        await this.userRepository.updateAgentStatus(
            agent.id,
            AgentStatus.READY,
        );

        const queuedRoom = await this.roomRepository.findUnassignedRoom();

        if (queuedRoom) {
            await this.roomRepository.assignAgentToRoom(
                queuedRoom.id,
                agent.id,
            );
            agent.activeChatCount += 1;
            agent.isAssigned = true;
            await this.userRepository.save(agent);

            await this.natsClient
                .emit('agent.assigned', {
                    agentId: agent.id,
                    roomId: queuedRoom.id,
                })
                .toPromise();

            return {
                username: agentName,
                roomNo: queuedRoom.id,
                message: `Agent ${agentName} assigned to roomNo: '${queuedRoom.id}'`,
            };
        }

        return { message: `Agent ${agentName} is now ready.` };
    }

    async agentBusy(agentName: string) {
        const agent = await this.userRepository.findByUsername(agentName);

        if (!agent) throw new NotFoundException(`${agentName} not found.`);

        if (agent.status === AgentStatus.BUSY) {
            return {
                message: `Agent: ${agentName} is already busy.`,
            };
        }

        await this.userRepository.updateAgentStatus(agent.id, AgentStatus.BUSY);

        return {
            message: `Agent: ${agentName} is now busy.`,
        };
    }

    async finishAgentChat(agentId: number) {
        const agent = await this.userRepository.findOne({
            where: { id: agentId, role: Role.AGENT },
        });
        if (!agent)
            throw new NotFoundException(`Agent \"${agentId}\" not found.`);

        agent.activeChatCount = Math.max(agent.activeChatCount - 1, 0);
        agent.isAssigned = agent.activeChatCount > 0;
        await this.userRepository.save(agent);

        const queuedRoom = await this.roomRepository.findUnassignedRoom();
        if (queuedRoom && agent.activeChatCount === 0) {
            await this.roomRepository.assignAgentToRoom(queuedRoom.id, agentId);
            agent.activeChatCount += 1;
            agent.isAssigned = true;
            await this.userRepository.save(agent);

            await this.natsClient
                .emit('agent.assigned', { agentId, roomId: queuedRoom.id })
                .toPromise();

            return { message: `Agent reassigned to room ${queuedRoom.id}.` };
        }

        return {
            message: agent.isAssigned
                ? 'Agent finished one chat but still active.'
                : 'Agent is ready (no room available).',
        };
    }

    async getAllAgents() {
        return this.userRepository.find({ where: { role: Role.AGENT } });
    }

    async getAllReadyAgents() {
        return this.userRepository.find({
            where: { role: Role.AGENT, status: AgentStatus.READY },
        });
    }

    async getAllBusyAgents() {
        return this.userRepository.find({
            where: { role: Role.AGENT, status: AgentStatus.BUSY },
        });
    }

    // get all manager with relation agent
    async getAllManagers() {
        const managers = await this.userRepository.getAllManagers();

        // Map over the managers and agents to filter out sensitive information
        const filteredManagers = managers.map((manager) => {
            // Remove sensitive fields
            const { password, twoFASecret, otp, resetToken, ...managerData } =
                manager;

            // Filter agents as well
            const filteredAgents = manager.agents?.map((agent) => {
                const { password, twoFASecret, otp, resetToken, ...agentData } =
                    agent;
                return agentData; // Return filtered agent data without sensitive information
            });

            return { ...managerData, agents: filteredAgents }; // Return manager data without sensitive fields
        });

        return filteredManagers;
    }
}
