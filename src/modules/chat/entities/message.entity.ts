// src/modules/chat/entities/message.entity.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @Column()
    sender: string; // User or Agent ID

    @CreateDateColumn({ type: 'timestamp' })
    timestamp: Date;

    @ManyToOne(() => Room, (room) => room.messages)
    room: Room; // Relationship with Room entity
}
