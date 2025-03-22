import { Injectable } from '@nestjs/common';
import { Role } from 'src/enums/user-role';
import { AgentService } from '../agents/agent.service';
import { ChatService } from '../chat/chat.service';
import { Room } from '../chat/entities/room.entity';
import { NatsService } from '../nats/nats.service';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
    constructor(
        private readonly chatService: ChatService,
        private readonly natsService: NatsService,
        private readonly agentService: AgentService,
        private readonly userRepository: UserRepository,
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

    async requestAssistance(
        userId: string,
    ): Promise<{ message: string; room: Room }> {
        console.log(`[USER REQUEST] User ${userId} requested assistance.`);

        // Create a unique chat room for the user
        let { message, room: chatRoom } =
            await this.chatService.createRoom(userId);

        // ✅ Check if an agent was already assigned inside createRoom
        let assignedAgent = chatRoom.agentId
            ? await this.agentService.getAgentById(chatRoom.agentId)
            : await this.agentService.getNextAvailableAgent();

        if (assignedAgent) {
            // ✅ Assign agent only if it wasn’t already assigned
            if (!chatRoom.agentId) {
                chatRoom.agentId = assignedAgent.agentId;
                chatRoom = await this.chatService.updateRoom(chatRoom);
            }

            // ✅ Mark agent as "busy"
            await this.agentService.markAgentBusy(assignedAgent.agentId);

            console.log(
                `[USER REQUEST] Assigned Agent ${assignedAgent.agentId} to Room ${chatRoom.id}.`,
            );

            // ✅ Correctly update response message
            message = `Agent ${assignedAgent.agentId} is assigned to your chat.`;
        } else {
            console.log(
                `[USER REQUEST] No agents available. Room ${chatRoom.id} is waiting.`,
            );
            message = `Chat room created. Waiting for an agent.`;
        }

        // Publish user request to NATS JetStream
        await this.natsService.publish('user.request', {
            userId,
            roomId: chatRoom.id,
        });

        return {
            message,
            room: chatRoom,
        };
    }

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
            const {
                password,
                otp,
                otpExpires,
                resetToken,
                resetTokenExpires,
                twoFASecret,
                ...sanitizedUser
            } = user;
            return sanitizedUser;
        });

        return {
            message: 'All request for active users',
            users: sanitizedUsers,
        };
    }
}
