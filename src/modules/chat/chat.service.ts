import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentStatus } from 'src/enums/user-role';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { S3ConfigService } from '../config/s3.config';
import { UserRepository } from '../user/user.repository';
import { MessageRepository } from './repositories/message.repository';
import { RoomRepository } from './repositories/room.repository';

@Injectable()
export class ChatService implements OnModuleInit {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly messageRepository: MessageRepository,
        private readonly userRepository: UserRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly s3ConfigService: S3ConfigService,
    ) {}

    onModuleInit() {
        console.log(`✅ ChatService initialized.`);
    }

    async createRoom(userId: string, language: string, department: string) {
        const agent = await this.userRepository.findReadyUnassignedAgent(
            language,
            department,
        );

        let chatRoom = this.roomRepository.create({
            name: `room_${userId}`,
            userId,
            agentId: agent ? agent.id : null,
        });

        chatRoom = await this.roomRepository.save(chatRoom);

        if (agent) {
            agent.isAssigned = true;
            agent.status = AgentStatus.BUSY;
            await this.userRepository.save(agent);
        }

        return {
            message: `Chat room created. ${agent ? `Agent ${agent.username} assigned.` : 'Waiting for an agent.'}`,
            room: chatRoom,
        };
    }

    async assignAgent(roomId: number, agentId: number): Promise<void> {
        await this.roomRepository.assignAgentToRoom(roomId, agentId);
        const agent = await this.userRepository.findById(agentId);
        if (agent) {
            agent.isAssigned = true;
            agent.status = AgentStatus.BUSY;
            await this.userRepository.save(agent);
        }
    }

    async getWaitingUsers() {
        const waitingRooms = await this.roomRepository.getWaitingRooms();
        return {
            queueSize: waitingRooms.length,
            waitingRooms: waitingRooms.map((room) => ({
                roomId: room.id,
                userId: room.userId ?? 'Unknown',
                roomName: room.name,
                department: room.department,
                language: room.language,
            })),
        };
    }

    async getNextWaitingRoom() {
        return this.roomRepository.findOne({
            where: { agentId: IsNull() },
            order: { id: 'ASC' },
        });
    }

    async updateRoom(chatRoom) {
        return this.roomRepository.save(chatRoom);
    }

    async deleteRoom(roomId: number) {
        await this.roomRepository.deleteRoom(roomId);
    }

    async getRoomById(roomId: number) {
        return this.roomRepository.findOne({ where: { id: roomId } });
    }

    async saveMessage(roomId: number, sender: string, content: string) {
        return this.messageRepository.saveMessage(roomId, sender, content);
    }

    async getChatHistory(roomId: number) {
        return this.messageRepository.getChatHistory(roomId);
    }

    async uploadFile(
        file: Express.Multer.File,
        roomId: string,
        senderType: string,
    ) {
        const fileKey = `${roomId}/${uuidv4()}-${file.originalname}`;

        const params = {
            Bucket: this.s3ConfigService.getBucketName(),
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        };

        await this.s3ConfigService.s3.upload(params).promise();

        const fileUrl = `${process.env.S3_URL}/${this.s3ConfigService.getBucketName()}/${fileKey}`;

        await this.messageRepository.saveMessage(
            Number(roomId),
            senderType,
            fileUrl,
        );

        this.eventEmitter.emit('file.uploaded', { roomId, fileUrl });

        return { fileUrl, fileKey };
    }

    async leaveUserChat(userId: string) {
        const chatRoom = await this.roomRepository.findOne({
            where: { userId },
        });
        if (!chatRoom) return { message: `User ${userId} not found in chat.` };

        if (chatRoom.agentId) {
            const agent = await this.userRepository.findById(chatRoom.agentId);
            if (agent) {
                agent.isAssigned = false;
                agent.status = AgentStatus.READY;
                await this.userRepository.save(agent);
            }
        }

        await this.roomRepository.deleteRoom(chatRoom.id);
        return { message: `User ${userId} removed from chat.` };
    }

    async leaveAgentChat(agentId: number) {
        const agent = await this.userRepository.findById(agentId);
        if (!agent) return { message: `Agent ${agentId} not found.` };

        agent.isAssigned = false;
        agent.status = AgentStatus.READY;
        await this.userRepository.save(agent);

        const waitingRoom = await this.getNextWaitingRoom();
        if (waitingRoom) {
            await this.roomRepository.assignAgentToRoom(
                waitingRoom.id,
                agentId,
            );

            agent.isAssigned = true;
            agent.status = AgentStatus.BUSY;
            await this.userRepository.save(agent);

            return {
                message: `Agent ${agentId} is now assigned to Room ${waitingRoom.id}.`,
                roomId: waitingRoom.id,
                userId: waitingRoom.userId,
            };
        }

        return {
            message: `Agent ${agentId} is now ready and no users are in the queue.`,
            roomId: null,
            userId: null,
        };
    }

    async getWaitingRoomByUser(userId: string) {
        return this.roomRepository.findOne({
            where: { userId, agentId: IsNull() },
        });
    }

    async getAssignedRooms(agentId: number) {
        const rooms = await this.roomRepository.find({
            where: { agentId },
            relations: ['messages'],
        });

        return rooms.map((room) => ({
            roomId: room.id,
            userId: room.userId,
            roomName: room.name,
            message: room.messages?.[room.messages.length - 1]?.content || '',
            createdAt: room.createdAt, // Send the createdAt timestamp to frontend
        }));
    }

    async getQueuedRooms() {
        const rooms = await this.roomRepository.find({
            where: { agentId: IsNull() },
            relations: ['messages'],
        });

        return rooms.map((room) => ({
            roomId: room.id,
            userId: room.userId,
            roomName: room.name,
            message: room.messages?.[room.messages.length - 1]?.content || '',
            createdAt: room.createdAt, // Send the createdAt timestamp to frontend
        }));
    }
}
