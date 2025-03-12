// src/modules/chat/chat.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Room } from './entities/room.entity';

@Injectable()
export class ChatRepository {
    constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
    ) {}

    async createRoom(name: string): Promise<Room> {
        const room = this.roomRepository.create({ name }); // Use 'name' instead of 'roomId'
        return this.roomRepository.save(room);
    }

    async updateRoomAgent(roomId: number, agentId: string): Promise<void> {
        await this.roomRepository.update({ id: roomId }, { agentId }); // Use 'id' instead of 'roomId'
    }

    async createMessage(
        roomId: number,
        sender: string,
        content: string,
    ): Promise<Message> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });
        if (!room) {
            throw new Error('Room not found');
        }

        const message = this.messageRepository.create({
            content,
            sender,
            room, // Use the 'room' object, not 'roomId'
            timestamp: new Date(),
        });
        return this.messageRepository.save(message);
    }

    async getMessagesByRoomId(roomId: number): Promise<Message[]> {
        return this.messageRepository.find({
            where: { room: { id: roomId } }, // Use 'room: { id: roomId }'
            order: { timestamp: 'ASC' },
        });
    }
}
