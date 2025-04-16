import { User } from 'src/modules/user/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn, // To explicitly join with user
    ManyToOne, // Use ManyToOne relationship with User
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { IsOptional } from 'class-validator';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true, name: 'user_id', length: 255 })
    userId: string; // Keep as varchar or nullable string

    @Column({ type: 'int', nullable: true })
    agentId: number | null;

    @ManyToOne(() => User, (user) => user.rooms, { nullable: true }) // Relationship with User
    @JoinColumn({ name: 'userId' }) // Explicitly linking to 'userId' column
    user: User; // Linking Room to User (if needed)

    @OneToMany(() => Message, (message) => message.room)
    messages: Message[];

    @Column({ type: 'text', nullable: true })
    language?: string;

    @Column({ type: 'text', nullable: true })
    department?: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'varchar', nullable: true, length: 255 })
    initialMessage?: string;

    @IsOptional()
    @Column({ type: 'boolean', default: true, name: 'active', nullable: true })
    active: boolean;

    getDto() {
        return {
            id: this.id,
            name: this.name,
            userId: this.userId,
            agentId: this.agentId,
            message: this.messages?.[this.messages.length - 1]?.content || '',
            active: this.active,
            createdAt: this.createdAt,
        };
    }
}
