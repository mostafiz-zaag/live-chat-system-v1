import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../../enums/user-role';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    username?: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ type: 'enum', enum: Role })
    role: Role;

    @Column({ nullable: true })
    department?: string;

    // Manager-Agent Relationship
    @ManyToOne(() => User, (user) => user.agents, { nullable: true })
    manager?: User;

    @OneToMany(() => User, (user) => user.manager)
    agents?: User[];
}
