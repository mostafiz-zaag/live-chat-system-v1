import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../agents/entities/agent.entity'; // Import the Agent entity
import { S3ConfigService } from '../config/s3.config';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Room } from './entities/room.entity';
import { AgentRepository } from '../agents/agent.repository';
import { RoomRepository } from './repositories/room.repository';
import { MessageRepository } from './repositories/message.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message, Room, Agent]), // Add Agent to the array
        EventEmitterModule.forRoot(),
    ],
    controllers: [ChatController],
    providers: [
        ChatRepository,
        ChatService,
        S3ConfigService,
        AgentRepository,
        RoomRepository,
        MessageRepository,
    ],
    exports: [ChatService],
})
export class ChatModule {}
