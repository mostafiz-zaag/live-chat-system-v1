import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentStatus } from 'src/enums/user-role';
import { SecurityUtil } from 'src/utils/security.util';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { S3ConfigService } from '../config/s3.config';
import { UserRepository } from '../user/user.repository';
import { MessageRepository } from './repositories/message.repository';
import { RoomRepository } from './repositories/room.repository';
import { PageRequest } from '../../common/dto/page-request.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService implements OnModuleInit {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly messageRepository: MessageRepository,
        private readonly userRepository: UserRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly s3ConfigService: S3ConfigService,
        private readonly securityUtil: SecurityUtil,
    ) {}

    onModuleInit() {
        console.log(`✅ ChatService initialized.`);
    }

    async createRoom(userId: string, language: string, department: string) {
        const agent = await this.userRepository.findReadyUnassignedAgent(language, department);

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

    // async getWaitingUsers() {
    //     const waitingRooms = await this.roomRepository.getWaitingRooms();
    //     return {
    //         queueSize: waitingRooms.length,
    //         waitingRooms: waitingRooms.map((room) => ({
    //             roomId: room.id,
    //             userId: room.userId ?? 'Unknown',
    //             roomName: room.name,
    //             department: room.department,
    //             language: room.language,
    //             initialMessage: initialMessage?.content ?? null,
    //         })),
    //     };
    // }

    async getWaitingUsers() {
        const waitingRooms = await this.roomRepository.getWaitingRooms();

        return {
            queueSize: waitingRooms.length,
            waitingRooms: waitingRooms,
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

    async saveMessage(roomId: number, sender: string, content: string): Promise<Message> {
        const message = new Message();

        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });

        message.type = 'text';
        message.room = room;
        message.sender = sender;
        message.content = content;
        message.timestamp = new Date();

        return await this.messageRepository.save(message);
    }

    // async getChatHistory(roomId: number, pageRequest: PageRequest) {
    //     // const chatHistory = await this.messageRepository.getChatHistory(roomId);
    //
    //     const queryBuilder = this.messageRepository.createQueryBuilder('message').leftJoinAndSelect('message.room', 'room');
    //
    //     const [chatHistories, total] = await queryBuilder
    //         .where('message.roomId = :roomId', { roomId })
    //         .orderBy('message.timestamp', 'ASC')
    //         .skip(pageRequest.page * pageRequest.size)
    //         .take(pageRequest.size)
    //         .getManyAndCount();
    //
    //     const chatHistoryDto = chatHistories.map((message) => {
    //         const { id, room, sender, timestamp, type, content } = message;
    //         const baseDto = {
    //             id,
    //             roomId: room.id,
    //             sender,
    //             timestamp,
    //             type,
    //         };
    //
    //         return type === 'file' ? { ...baseDto, fileUrl: content } : { ...baseDto, content };
    //     });
    //
    //     return createPaginatedResponse(chatHistoryDto, total, pageRequest);
    // }

    async getChatHistory(roomId: number, pageRequest: PageRequest) {
        // Create the query builder for fetching chat history

        // // If no page or size is provided, we fetch all messages
        // if (!pageRequest.page || !pageRequest.size) {
        //     // Fetch all messages without pagination
        //     const chatHistories = await queryBuilder.where('message.roomId = :roomId', { roomId }).orderBy('message.timestamp', 'ASC').getMany();
        //
        //     const chatHistoryDto = chatHistories.map((message) => {
        //         const { id, room, sender, timestamp, type, content } = message;
        //         const baseDto = {
        //             id,
        //             roomId: room.id,
        //             sender,
        //             timestamp,
        //             type,
        //         };
        //
        //         return type === 'file' ? { ...baseDto, fileUrl: content } : { ...baseDto, content };
        //     });
        //
        //     return createPaginatedResponse(chatHistoryDto, chatHistories.length, pageRequest); // Provide total length as total
        // } else {
        //     // Apply pagination if page and size are provided
        //     const [chatHistories, total] = await queryBuilder
        //         .where('message.roomId = :roomId', { roomId })
        //         .orderBy('message.timestamp', 'ASC')
        //         .skip(pageRequest.page * pageRequest.size)
        //         .take(pageRequest.size)
        //         .getManyAndCount();
        //
        //     const chatHistoryDto = chatHistories.map((message) => {
        //         const { id, room, sender, timestamp, type, content } = message;
        //         const baseDto = {
        //             id,
        //             roomId: room.id,
        //             sender,
        //             timestamp,
        //             type,
        //         };
        //
        //         return type === 'file' ? { ...baseDto, fileUrl: content } : { ...baseDto, content };
        //     });
        //
        //     return createPaginatedResponse(chatHistoryDto, total, pageRequest);
        // }

        const queryBuilder = this.messageRepository.createQueryBuilder('message').leftJoinAndSelect('message.room', 'room');

        // Apply pagination only if `page` and `size` are provided
        if (pageRequest.page && pageRequest.size) {
            queryBuilder
                .where('message.roomId = :roomId', { roomId })
                .orderBy('message.timestamp', 'ASC')
                .skip(pageRequest.page * pageRequest.size)
                .take(pageRequest.size);
        } else {
            // If no pagination is required, fetch all messages
            queryBuilder.where('message.roomId = :roomId', { roomId }).orderBy('message.timestamp', 'ASC');
        }

        // Fetch the chat history data and count based on pagination conditions
        const [chatHistories, total] = await queryBuilder.getManyAndCount();

        const chatHistoryDto = chatHistories.map((message) => {
            const { id, room, sender, timestamp, type, content } = message;
            const baseDto = {
                id,
                roomId: room.id,
                sender,
                timestamp,
                type,
            };

            return type === 'file' ? { ...baseDto, fileUrl: content } : { ...baseDto, content };
        });

        if (pageRequest.page && pageRequest.size) {
            return createPaginatedResponse(chatHistoryDto, total, pageRequest);
        }
        return {
            content: chatHistoryDto,
        };
    }

    // async uploadFile(file: Express.Multer.File, roomId: string, senderType: string) {
    //     const fileKey = `${roomId}/${uuidv4()}-${file.originalname}`;
    //
    //     const params = {
    //         Bucket: this.s3ConfigService.getBucketName(),
    //         Key: fileKey,
    //         Body: file.buffer,
    //         ContentType: file.mimetype,
    //         ACL: 'public-read',
    //     };
    //
    //     await this.s3ConfigService.s3.upload(params).promise();
    //
    //     const fileUrl = `${process.env.S3_URL}/${this.s3ConfigService.getBucketName()}/${fileKey}`;
    //
    //     await this.messageRepository.saveMessage(Number(roomId), senderType, fileUrl, 'file');
    //
    //     this.eventEmitter.emit('file.uploaded', { roomId, fileUrl, senderType });
    //
    //     return { fileUrl, fileKey };
    // }

    async uploadFile(file: Express.Multer.File, roomId: string, senderType: string) {
        const roomIdNum = Number(roomId);
        if (isNaN(roomIdNum)) {
            throw new Error('Invalid roomId: must be a valid number');
        }

        // Verify room exists
        const room = await this.roomRepository.findOne({ where: { id: roomIdNum } });
        if (!room) {
            throw new Error(`Room with id ${roomIdNum} not found`);
        }

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

        await this.messageRepository.saveMessage(roomIdNum, senderType, fileUrl, 'file');

        this.eventEmitter.emit('file.uploaded', { roomId, fileUrl, senderType });

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
            await this.roomRepository.assignAgentToRoom(waitingRoom.id, agentId);

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

    // async getAssignedRooms(agentId: number, pageRequest: PageRequest) {
    //     const queryBuilder = this.roomRepository.createQueryBuilder('room').leftJoinAndSelect('room.messages', 'messages');
    //
    //     const [rooms, total] = await queryBuilder
    //         .where('room.agentId = :agentId', { agentId })
    //         .orderBy({
    //             'room.active': 'DESC', // Sort by active first (true before false)
    //             'room.createdAt': 'DESC', // Then sort by createdAt within each active group
    //         })
    //         .skip(pageRequest.page * pageRequest.size)
    //         .take(pageRequest.size)
    //         .getManyAndCount();
    //
    //     const roomDTOs = rooms.map((value) => {
    //         return value.getDto();
    //     });
    //
    //     return createPaginatedResponse(roomDTOs, total, pageRequest);
    //
    // }

    async getAssignedRooms(agentId: number, pageRequest: PageRequest) {
        const queryBuilder = this.roomRepository.createQueryBuilder('room').leftJoinAndSelect('room.messages', 'messages');

        // Apply pagination only if `page` and `size` are provided
        if (pageRequest.page && pageRequest.size) {
            queryBuilder
                .where('room.agentId = :agentId', { agentId })
                .orderBy({
                    'room.active': 'DESC', // Sort by active first (true before false)
                    'room.createdAt': 'DESC', // Then sort by createdAt within each active group
                })
                .skip(pageRequest.page * pageRequest.size)
                .take(pageRequest.size);
        } else {
            // If no pagination is required, fetch all rooms
            queryBuilder.where('room.agentId = :agentId', { agentId }).orderBy({
                'room.active': 'DESC',
                'room.createdAt': 'DESC',
            });
        }

        // Fetch the rooms data and count based on pagination conditions
        const [rooms, total] = await queryBuilder.getManyAndCount();

        // Map the room data to DTO format
        const roomDTOs = rooms.map((value) => {
            return value.getDto();
        });

        // If pagination was applied, return paginated response
        if (pageRequest.page && pageRequest.size) {
            return createPaginatedResponse(roomDTOs, total, pageRequest);
        }

        // If no pagination was applied, return all rooms
        return {
            content: roomDTOs,
        };
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
            initialMessage: room.initialMessage,
        }));
    }

    async joinChat(roomId: number) {
        const loggedInUser = await this.securityUtil.getLoggedInUser();
        console.log('loggedInUser', loggedInUser);
        // Find the room that the agent is joining
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });

        console.log('room', room);

        if (!room) {
            throw new NotFoundException(`Room with ID ${roomId} not found.`);
        }

        // save: text on request assistance that's why comment here
        // const message = new Message();
        // message.type = 'text';
        // message.room = room;
        // message.sender = room.userId; // Assuming loggedInUser has the userId
        // message.content = room.initialMessage || 'No message';
        //
        // await this.messageRepository.save(message);

        // Check if the room is in the queue (i.e., no agent has been assigned)
        // if (room.agentId !== null) {
        //     throw new BadRequestException(
        //         `This room has already been taken by an agent.`,
        //     );
        // }

        // Assign the agent to the room
        room.agentId = loggedInUser.userId; // Assuming loggedInUser has the agentId

        // Save the updated room
        await this.roomRepository.save(room);

        // Optionally, you may want to update the agent's active chat count
        const agent = await this.userRepository.findOne({
            where: { id: loggedInUser.userId },
        });
        if (!agent) {
            throw new NotFoundException(`Agent with ID ${loggedInUser.userId} not found.`);
        }

        agent.activeChatCount += 1; // Increase the active chat count for the agent
        await this.userRepository.save(agent);

        return room; // Return the updated room
    }

    async getAllMessages(pageRequest: PageRequest) {
        const queryBuilder = this.messageRepository.createQueryBuilder('message').leftJoinAndSelect('message.room', 'room');

        const [messages, total] = await queryBuilder
            .orderBy('message.timestamp', 'DESC')
            .skip(pageRequest.page * pageRequest.size)
            .take(pageRequest.size)
            .getManyAndCount();

        return createPaginatedResponse(messages, total, pageRequest);
    }

    async updateMessageTimestamp(messageId: number, timestamp: Date) {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found.`);
        }

        message.timestamp = timestamp;

        return await this.messageRepository.save(message);
    }
}
