import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from '../chat/chat.module';
import { MessageRepository } from '../chat/repositories/message.repository';
import { RoomRepository } from '../chat/repositories/room.repository';
import { NatsModule } from '../nats/nats.module';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { CommonModule } from '../../common/modules/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        ChatModule, // Ensure ChatModule is imported for `ChatService`
        NatsModule, // Ensure `NATS_SERVICE` is available
        CommonModule,
    ],
    controllers: [UserController],
    providers: [UserService, UserRepository, RoomRepository, MessageRepository], // Add `RoomRepository` and `MessageRepository` to providers
    exports: [UserService, UserRepository], // Export `UserService` if needed elsewhere
})
export class UserModule {}
