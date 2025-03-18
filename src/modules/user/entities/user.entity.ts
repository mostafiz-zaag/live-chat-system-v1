import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
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

    @Column({ type: 'enum', enum: Role, default: Role.AGENT })
    role: Role;

    // Allow managers to have multiple departments
    @Column({ type: 'simple-array', nullable: true })
    departments?: string[];

    @Column({ default: true })
    isTemporaryPassword: boolean;

    // Agents must have a manager (CircularRelation Fix: nullable: true)
    @ManyToOne(() => User, (user) => user.agents, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    manager?: User;

    // Managers can have multiple agents
    @OneToMany(() => User, (user) => user.manager)
    agents?: User[];

    // Managers can have multiple languages
    @Column({ type: 'simple-array', nullable: true })
    languages?: string[];

    // Agents must have one language
    @Column({ nullable: true })
    language?: string;

    // **OTP Verification Fields**
    @Column({ nullable: true })
    otp?: string; // Stores OTP (hashed)

    @Column({ nullable: true, type: 'timestamp' })
    otpExpires?: Date; // OTP Expiration Time

    @Column({ nullable: true })
    resetToken?: string;

    @Column({ nullable: true })
    resetTokenExpires?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
