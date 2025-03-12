import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { AgentRepository } from '../agents/agent.repository';
import { S3ConfigService } from '../config/s3.config';
import { RoomRepository } from './repositories/room.repository';
import { MessageRepository } from './repositories/message.repository';
import { IsNull } from 'typeorm';
import { Room } from './entities/room.entity';

@Injectable()
export class ChatService implements OnModuleInit {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly messageRepository: MessageRepository,
        private readonly agentRepository: AgentRepository,
        private eventEmitter: EventEmitter2,
        private readonly s3ConfigService: S3ConfigService,
    ) {}

    onModuleInit() {
        console.log(`✅ ChatService initialized.`);
    }

    async uploadFile(
        file: Express.Multer.File,
        roomId: string,
        senderType: string,
    ) {
        const fileKey = `${roomId}/${uuidv4()}-${file.originalname}`;
        console.log(`📢 Uploading file for room ${roomId}`);

        const params = {
            Bucket: this.s3ConfigService.getBucketName(),
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        };

        try {
            await this.s3ConfigService.s3.upload(params).promise();

            const fileUrl = `${process.env.S3_URL}/${this.s3ConfigService.getBucketName()}/${fileKey}`;
            console.log(`✅ File uploaded: ${fileUrl}`);

            await this.messageRepository.saveMessage(
                Number(roomId),
                senderType,
                fileUrl,
            );

            // ✅ Emit event instead of directly calling WebSocket
            this.eventEmitter.emit('file.uploaded', { roomId, fileUrl });

            return { fileUrl, fileKey };
        } catch (error) {
            throw new Error(`File upload failed: ${error.message}`);
        }
    }

    async createRoom(userId: string) {
        console.log(`[CREATE ROOM] Creating chat room for user ${userId}`);

        const readyAgent = await this.agentRepository.findByStatus('ready');

        let chatRoom = this.roomRepository.create({
            name: `room_name_${userId}`,
            userId,
            agentId: readyAgent ? readyAgent.agentId : undefined,
        });

        chatRoom = await this.roomRepository.save(chatRoom);

        if (readyAgent) {
            await this.agentRepository.updateAgentStatus(
                readyAgent.agentId,
                'busy',
            );
            console.log(
                `[CREATE ROOM] Assigned Agent ${readyAgent.agentId} to Room ${chatRoom.id}`,
            );
        } else {
            console.log(
                `[CREATE ROOM] No agents available. Room ${chatRoom.id} is waiting.`,
            );
        }

        return {
            message: `Chat room created. ${readyAgent ? `Agent ${readyAgent.agentId} is assigned.` : `Waiting for an agent.`}`,
            room: chatRoom,
        };
    }

    async saveMessage(
        roomId: number | string,
        sender: string,
        content: string,
    ) {
        console.log(`[SAVE MESSAGE] Saving message in Room ID: ${roomId}`);

        const roomIdNum = parseInt(roomId as string, 10);
        if (isNaN(roomIdNum))
            throw new Error(`[ERROR] Invalid room ID received.`);

        const room = await this.roomRepository.getRoomById(roomIdNum);
        if (!room)
            throw new Error(`[ERROR] Room with ID ${roomIdNum} not found.`);

        return this.messageRepository.saveMessage(roomIdNum, sender, content);
    }

    async getChatHistory(roomId: number) {
        return this.messageRepository.getChatHistory(roomId);
    }

    async assignAgent(roomId: number, agentId: string) {
        await this.roomRepository.assignAgentToRoom(roomId, agentId);
    }

    async getWaitingUsers() {
        const waitingRooms = await this.roomRepository.getWaitingRooms();
        return {
            queueSize: waitingRooms.length,
            waitingRooms: waitingRooms.map((room) => ({
                roomId: room.id,
                userId: room.userId ?? 'Unknown',
                roomName: room.name,
            })),
        };
    }

    async deleteRoom(roomId: number) {
        await this.roomRepository.deleteRoom(roomId);
    }

    async leaveUserChat(userId: string) {
        const chatRoom = await this.roomRepository.findOne({
            where: { userId },
        });

        if (!chatRoom)
            return { message: `User ${userId} not found in any chat.` };

        if (chatRoom.agentId) {
            const agent = await this.agentRepository.findById(chatRoom.agentId);
            if (agent)
                await this.agentRepository.updateAgentStatus(
                    agent.agentId,
                    'ready',
                );
        }

        await this.roomRepository.deleteRoom(chatRoom.id);

        return { message: `User ${userId} successfully removed from chat.` };
    }

    async leaveAgentChat(agentId: string) {
        console.log(`[LEAVE CHAT] Agent ${agentId} is leaving the chat.`);

        const agent = await this.agentRepository.findById(agentId);
        if (!agent) return { message: `Agent ${agentId} not found.` };

        await this.agentRepository.updateAgentStatus(agent.agentId, 'ready');

        const waitingRooms = await this.roomRepository.getWaitingRooms();
        if (waitingRooms.length > 0) {
            const waitingRoom = waitingRooms[0];
            await this.roomRepository.assignAgentToRoom(
                waitingRoom.id,
                agent.agentId,
            );
            await this.agentRepository.updateAgentStatus(agent.agentId, 'busy');

            return {
                message: `Agent ${agentId} is now assigned to Room ${waitingRoom.id}.`,
                roomId: waitingRoom.id,
                userId: waitingRoom.userId!,
            };
        }

        return {
            message: `Agent ${agentId} is now ready and no users are in the queue.`,
        };
    }

    async getWaitingRoomByUser(userId: string): Promise<Room | null> {
        return await this.roomRepository.findOne({
            where: { userId, agentId: IsNull() },
        });
    }

    async updateRoom(chatRoom: Room): Promise<Room> {
        return this.roomRepository.save(chatRoom); // Save the updated room
    }

    async getRoomById(roomId: number): Promise<Room | null> {
        return this.roomRepository.findOne({ where: { id: roomId } });
    }

}
