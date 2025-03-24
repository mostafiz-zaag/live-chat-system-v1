import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true })
    userId: string | null; // ✅ keep as varchar or nullable string

    @Column({ type: 'int', nullable: true })
    agentId: number | null;

    @OneToMany(() => Message, (message) => message.room)
    messages: Message[];

    // ✅ Add these fields to store user request context
    @Column({ type: 'text', nullable: true })
    language?: string;

    @Column({ type: 'text', nullable: true })
    department?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}
