import {
    BeforeInsert,
    BeforeUpdate,
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

    @Column({ default: false })
    isActive: boolean; // <-- New isActive Column

    @Column({ type: 'simple-array', nullable: true })
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

    @Column({ type: 'simple-array', nullable: true })
    languages?: string[];

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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Lifecycle Hooks to ensure correct isActive state
    @BeforeInsert()
    @BeforeUpdate()
    setActiveStatus() {
        this.isActive = this.role === Role.ADMIN;
    }
}
