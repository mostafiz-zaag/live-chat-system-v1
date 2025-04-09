import { Room } from 'src/modules/chat/entities/room.entity';
import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AgentStatus, Role } from '../../../enums/user-role';

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

    @Column({ default: false, type: 'boolean' })
    isActive: boolean; // <-- New isActive Column

    @Column({ type: 'text', array: true, nullable: true }) // ✅ Corrected clearly
    languages?: string[];

    @Column({ type: 'text', array: true, nullable: true }) // ✅ Corrected clearly
    departments?: string[];

    @Column({ default: true })
    isTemporaryPassword: boolean;

    @ManyToOne(() => User, (user) => user.agents, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    manager?: User;

    @OneToMany(() => User, (user) => user.manager)
    agents?: User[];

    @Column({ nullable: true })
    language?: string;

    @Column({ nullable: true })
    otp?: string;

    @Column({ nullable: true, type: 'timestamp' })
    otpExpires?: Date;

    @Column({ nullable: true })
    resetToken?: string;

    @Column({ nullable: true })
    resetTokenExpires?: Date;

    @Column({ nullable: true })
    twoFASecret?: string;

    @Column({ default: false })
    is2FAEnabled: boolean;

    @Column({ default: false })
    twoFAVerified: boolean;

    @Column({ default: false })
    isRequested: boolean;

    @Column({ default: false })
    isAssigned: boolean;

    @Column({
        type: 'enum',
        enum: AgentStatus,
        default: AgentStatus.BUSY, // Default clearly set to BUSY
    })
    status: AgentStatus;

    @Column({ default: 0 })
    activeChatCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    lastLogin?: Date;

    @Column({ nullable: true })
    requestedType?: string;

    @Column({ nullable: true })
    requestedDate?: Date;

    @Column({ nullable: true })
    message?: string;

    // Lifecycle Hooks to ensure correct isActive state
    @BeforeInsert()
    // @BeforeUpdate()
    setActiveStatus() {
        this.isActive = this.role === Role.ADMIN;
    }

    @OneToMany(() => Room, (room) => room.user)
    rooms: Room[];
}
