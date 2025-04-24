import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../agents/entities/agent.entity'; // Import the Agent entity
import { CommonModule } from '../common/common.module';
import { S3ConfigService } from '../config/s3.config';
import { UserRepository } from '../user/user.repository';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Room } from './entities/room.entity';
import { MessageRepository } from './repositories/message.repository';
import { RoomRepository } from './repositories/room.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message, Room, Agent]), // Add Agent to the array
        EventEmitterModule.forRoot(),
        CommonModule,
    ],
    controllers: [ChatController],
    providers: [
        ChatRepository,
        ChatService,
        S3ConfigService,
        // AgentRepository,
        RoomRepository,
        MessageRepository,
        UserRepository,
    ],
    exports: [ChatService],
})
export class ChatModule {}
