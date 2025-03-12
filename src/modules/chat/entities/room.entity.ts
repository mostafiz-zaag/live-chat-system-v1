import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true }) // ✅ Use `varchar` instead of `Object`
    userId: string | null;

    @Column({ type: 'varchar', nullable: true }) // ✅ Use `varchar` instead of `Object`
    agentId: string | null;

    @OneToMany(() => Message, (message) => message.room)
    messages: Message[];
}
