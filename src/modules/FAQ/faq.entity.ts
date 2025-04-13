import { Transform } from 'class-transformer';
import { Role } from 'src/enums/user-role';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ExecutorSerializer } from '../user/dto/executor.serializer';
import { User } from '../user/entities/user.entity';

@Entity()
export class Faq {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sentence: string;

    @Column({
        type: 'varchar',
        nullable: true,
        length: 50,
        name: 'role',
    })
    role: Role;

    @Column({
        nullable: false,
        default: true,
        type: 'boolean',
        name: 'is_active',
    })
    isActive: boolean;

    @Transform(({ value }) => ExecutorSerializer.serialize(value), {
        toPlainOnly: true,
    })
    @ManyToOne(() => User, (user) => user.faqs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    createdBy?: User;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
