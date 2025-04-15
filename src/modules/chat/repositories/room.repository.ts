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

    async assignAgentToRoom(roomId: number, agentId: number): Promise<void> {
        const room = await this.findOne({ where: { id: roomId } });
        if (room) {
            room.agentId = agentId;
            await this.save(room);
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
        });
    }

    async deleteRoom(roomId: number): Promise<void> {
        await this.delete(roomId);
    }

    // room.repository.ts
    async createRoomForUser(
        userId: string, // This is the guest userId (e.g., "hi")
        language: string,
        department: string,
        initialMessage: string,
    ): Promise<Room> {
        console.log('Creating room for user:', userId);

        // For guest users, skip the user lookup and just create the room
        const room = this.create({
            userId: userId, // Store the guest userId (e.g., "hi") as a string
            name: `Room for User ${userId}`,
            agentId: null, // Initially, no agent assigned
            language,
            department,
            user: null, // No user entity associated
            initialMessage,
        });

        console.log('Room created: Here', room);

        return this.save(room); // Save the room
    }
}
