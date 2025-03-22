import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Room } from '../entities/room.entity';

@Injectable()
export class RoomRepository extends Repository<Room> {
    constructor(private readonly dataSource: DataSource) {
        super(Room, dataSource.createEntityManager());
    }

    async findUnassignedRoom(): Promise<Room | null> {
        return this.findOne({ where: { agentId: IsNull() } });
    }

    // In RoomRepository
    async assignAgentToRoom(roomId: number, agentId: string): Promise<void> {
        const room = await this.findOne({ where: { id: roomId } });
        if (room) {
            room.agentId = agentId; // Assign agentId
            await this.save(room); // Save updated room
        } else {
            throw new Error(`Room with ID ${roomId} not found.`);
        }
    }

    async getRoomById(roomId: number): Promise<Room | null> {
        return this.findOne({ where: { id: roomId } });
    }

    async getWaitingRooms(): Promise<Room[]> {
        return this.find({
            where: { agentId: IsNull() },
            select: ['id', 'userId', 'name'],
        });
    }

    async deleteRoom(roomId: number): Promise<void> {
        await this.delete(roomId);
    }

    // Update
    // room.repository.ts
    async createRoomForUser(userId: string): Promise<Room> {
        const room = this.create({
            userId,
            name: `Room for User ${userId}`,
            agentId: null, // no agent initially
        });
        return await this.save(room);
    }
}
