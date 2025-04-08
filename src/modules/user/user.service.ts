import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AgentStatus, Role } from 'src/enums/user-role';
import { ChatService } from '../chat/chat.service';
import { MessageRepository } from '../chat/repositories/message.repository';
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
        private readonly messageRepository: MessageRepository,
    ) {}

    // user.service.ts
    async requestAssistance(
        userId: string,
        language: string,
        department: string,
    ) {
        // Step 1: Create a new room for the user
        const chatRoom = await this.roomRepository.createRoomForUser(
            userId,
            language, // Store as an array
            department, // Store as an array
        );

        // Step 2: Find an available agent who can handle the request
        const agent = await this.userRepository.findReadyUnassignedAgent(
            language,
            department,
        );

        console.log('Agent found: ', agent);

        if (agent) {
            // Step 3: Assign agent to the room
            await this.roomRepository.assignAgentToRoom(chatRoom.id, agent.id);

            // Increase the agent's active chat count as they are now assigned to the room
            agent.activeChatCount += 1; // Increase active chat count to handle multiple chats
            agent.isAssigned = true;

            // Save the updated agent data
            await this.userRepository.save(agent);

            // Emit the agent assignment event (e.g., notifying the system)
            await this.natsClient
                .emit('agent.assigned', {
                    agentId: agent.id,
                    roomId: chatRoom.id,
                })
                .toPromise();

            return {
                message: `Agent ${agent.username} auto-assigned to room ${chatRoom.id}`,
                room: chatRoom,
            };
        } else {
            // If no agent is available, add the user to the queue and wait for an agent
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
        if (!agent) throw new NotFoundException(`Agent ${agentId} not found.`);

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

    async queueListForManager(managerId: number) {
        const manager = await this.userRepository.findById(managerId);
        if (manager.role !== 'manager')
            throw new NotFoundException(`Manager not found.`);

        const queue = await this.getQueueSize();

        // check manager languages and departments are match with queue languages and departments
        const filteredQueue = queue.waitingRooms.filter((room) => {
            return (
                manager.languages.includes(room.language) &&
                manager.departments.includes(room.department)
            );
        });

        return filteredQueue;
    }

    async getAgentsChatByManager(managerId: number) {
        const manager = await this.userRepository.findOne({
            where: { id: managerId, role: Role.MANAGER },
            relations: ['agents'], // Fetch agents under the manager
        });

        console.log('Manager ', manager);

        if (!manager) {
            throw new NotFoundException(
                `Manager with ID ${managerId} not found.`,
            );
        }

        const agents = manager.agents; // Get all agents for this manager

        // Fetch all rooms assigned to the agents
        const agentRooms = [];

        for (const agent of agents) {
            const rooms = await this.roomRepository.find({
                where: { agentId: agent.id }, // Fetch rooms assigned to this agent
            });

            // For each room, get the chat history
            const roomWithHistory = [];

            for (const room of rooms) {
                const messages = await this.messageRepository.find({
                    where: { room: { id: room.id } }, // Fetch messages for this room
                });

                roomWithHistory.push({
                    roomId: room.id,
                    messages, // Chat history for this room
                });
            }

            agentRooms.push({
                agentId: agent.id,
                agentName: agent.username,
                rooms: roomWithHistory, // Rooms with their messages
            });
        }

        return {
            message: `Chats for agents under Manager ${managerId} fetched successfully.`,
            agentRooms,
        };
    }
}
