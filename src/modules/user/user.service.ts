import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AgentStatus, Role } from 'src/enums/user-role';
import { AgentService } from '../agents/agent.service';
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
        private readonly agentService: AgentService,
        private readonly userRepository: UserRepository,
        private readonly roomRepository: RoomRepository,
    ) {}

    // async requestAssistance(
    //     userId: string,
    // ): Promise<{ message: string; room: Room }> {
    //     console.log(`[USER REQUEST] User ${userId} requested assistance.`);

    //     // Create a unique chat room for the user
    //     let { message, room: chatRoom } =
    //         await this.chatService.createRoom(userId);

    //     // Check for an available agent
    //     const readyAgent = await this.agentService.getNextAvailableAgent();

    //     if (readyAgent) {
    //         // Assign agent to the room immediately
    //         chatRoom.agentId = readyAgent.agentId;
    //         chatRoom = await this.chatService.updateRoom(chatRoom);

    //         // Mark agent as "busy"
    //         const agent = await this.agentService.markAgentBusy(
    //             readyAgent.agentId,
    //         );

    //         console.log(
    //             '--------------agent after assigning-----------',
    //             agent,
    //         );

    //         console.log(
    //             `[USER REQUEST] Assigned Agent ${readyAgent.agentId} to Room ${chatRoom.id}.`,
    //         );
    //     } else {
    //         console.log(
    //             `[USER REQUEST] No agents available. Room ${chatRoom.id} is waiting.`,
    //         );
    //     }

    //     // Publish user request to NATS JetStream
    //     await this.natsService.publish('user.request', {
    //         userId,
    //         roomId: chatRoom.id,
    //     });

    //     return {
    //         message: `Chat room created. ${readyAgent ? `Agent ${readyAgent.agentId} is assigned.` : `Waiting for an agent.`}`,
    //         room: chatRoom,
    //     };
    // }

    // async requestAssistance(dto: RequestAssistanceDto) {
    //     const { userId, language, department } = dto;

    //     // Step 1: Create a new room for the user
    //     const { room: chatRoom } = await this.chatService.createRoom(userId);

    //     // Step 2: Check for matching 'READY' agents
    //     const agent = await this.userRepository.findReadyMatchingAgent(
    //         language,
    //         department,
    //     );

    //     console.log('Agent', agent);

    //     let message: string;

    //     if (agent) {
    //         // Assign agent immediately
    //         chatRoom.agentId = agent.id.toString();
    //         await this.chatService.updateRoom(chatRoom);

    //         // Mark agent as assigned (active)
    //         if (!agent.isAssigned) {
    //             agent.isAssigned = true; // First assignment made
    //             await this.userRepository.save(agent);
    //         }

    //         message = `Agent ${agent.username} assigned to your chat immediately.`;
    //         console.log(
    //             `[ASSIGNED] User ${userId} → Agent ${agent.id} (READY)`,
    //         );
    //     } else {
    //         // No matching READY agent found, add to JetStream queue
    //         await this.natsService.publish('user.request', {
    //             userId,
    //             roomId: chatRoom.id,
    //             language,
    //             department,
    //         });

    //         message =
    //             'No matching agent available at the moment. You have been placed in the queue.';
    //         console.log(
    //             `[QUEUED] User ${userId} queued due to no READY agents.`,
    //         );
    //     }

    //     return {
    //         message,
    //         room: chatRoom,
    //     };
    // }

    async getQueueSize(): Promise<{
        queueSize: number;
        waitingRooms: { roomId: number; userId: string; roomName: string }[];
    }> {
        return await this.chatService.getWaitingUsers();
    }

    async getAllUsers(role?: Role) {
        if (role) {
            return this.userRepository.find({ where: { role } });
        }
        return this.userRepository.find();
    }

    async allRequestForActiveUsers() {
        const users = await this.userRepository.allRequestForActiveUsers();

        const sanitizedUsers = users.map((user) => {
            const { password, ...sanitizedUser } = user;
            return sanitizedUser;
        });

        return {
            message: 'All request for active users',
            users: sanitizedUsers,
        };
    }

    // FOR AGENT
    async agentJoinQueue(agentName: string) {
        const agent = await this.userRepository.findByUsername(agentName);
        if (!agent)
            throw new NotFoundException(`Agent "${agentName}" not found.`);

        await this.userRepository.updateAgentStatus(
            agent.id,
            AgentStatus.READY,
        );

        const queuedRoom = await this.roomRepository.findUnassignedRoom();

        if (queuedRoom) {
            await this.roomRepository.assignAgentToRoom(
                queuedRoom.id,
                agent.id.toString(),
            );
            await this.natsClient
                .emit('agent.assigned', {
                    agentId: agent.id,
                    roomId: queuedRoom.id,
                })
                .toPromise();

            return {
                username: agentName,
                roomNo: queuedRoom.id,
                message: `Agent ${agentName} assigned to room ${queuedRoom.id}.`,
            };
        }

        return { message: `Username ${agentName} is now ready.` };
    }
    // user.service.ts
    async requestAssistance(
        userId: string,
        language: string,
        department: string,
    ) {
        const chatRoom = await this.roomRepository.createRoomForUser(userId);
        const agent = await this.userRepository.findReadyUnassignedAgent(
            language,
            department,
        );

        if (agent) {
            await this.roomRepository.assignAgentToRoom(
                chatRoom.id,
                agent.id.toString(),
            );

            // Mark agent as assigned clearly
            agent.isAssigned = true;
            await this.userRepository.save(agent);

            return {
                message: `Agent ${agent.username} auto-assigned.`,
                room: chatRoom,
            };
        } else {
            // Queue the user request clearly
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

    async finishChat(agentId: number) {
        const agent = await this.userRepository.findOne({
            where: { id: agentId, role: Role.AGENT },
        });
        if (!agent)
            throw new NotFoundException(`Agent "${agentId}" not found.`);

        await this.userRepository.updateAgentStatus(agentId, AgentStatus.READY);

        const queuedRoom = await this.roomRepository.findUnassignedRoom();
        if (queuedRoom) {
            await this.roomRepository.assignAgentToRoom(
                queuedRoom.id,
                agentId.toString(),
            );
            await this.natsClient
                .emit('agent.assigned', {
                    agentId,
                    roomId: queuedRoom.id,
                })
                .toPromise();

            return { message: `Agent reassigned to room ${queuedRoom.id}.` };
        }

        return { message: 'Agent is ready (no room available).' };
    }

    async getAllAgents() {
        return this.userRepository.find({ where: { role: Role.AGENT } });
    }
}
