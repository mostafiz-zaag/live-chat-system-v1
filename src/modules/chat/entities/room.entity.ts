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

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true })
    userId: string | null; // Keep as varchar or nullable string

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

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}
