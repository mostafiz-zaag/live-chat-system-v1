// src/modules/chat/entities/message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @Column()
    sender: string; // User or Agent ID

    @Column()
    timestamp: Date;

    @ManyToOne(() => Room, (room) => room.messages)
    room: Room; // Relationship with Room entity
}