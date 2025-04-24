import { AccountStatus } from 'src/enums/account-status.enum';
import { Room } from 'src/modules/chat/entities/room.entity';
import { Faq } from 'src/modules/FAQ/faq.entity';
import { BeforeInsert, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AgentStatus, Role } from '../../../enums/user-role';
import { LiteManagerDto } from '../dto/LiteManager.dto';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    username?: string;

    @Column({ unique: true, nullable: true })
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

    @Column({
        type: 'enum',
        enum: AccountStatus,
        default: AccountStatus.ACTIVE, // Default clearly set to ACTIVE
    })
    accountStatus: string;

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

    @OneToMany(() => Faq, (faq) => faq.createdBy)
    faqs: Faq[];

    @OneToMany(() => Room, (room) => room.user)
    rooms: Room[];

    getDto() {
        const managerDTO = new LiteManagerDto();
        managerDTO.id = this.manager?.id;
        managerDTO.username = this.manager?.username;

        return {
            id: this.id,
            email: this.email,
            username: this.username,
            role: this.role,
            isActive: this.isActive,
            status: this.status,
            accountStatus: this.accountStatus,
            departments: this.departments,
            languages: this.languages,
            manager: managerDTO,
        };
    }
}
