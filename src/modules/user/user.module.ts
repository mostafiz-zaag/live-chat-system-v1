import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from '../chat/chat.module';
import { RoomRepository } from '../chat/repositories/room.repository';
import { NatsModule } from '../nats/nats.module';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        ChatModule, // Ensure ChatModule is imported for `ChatService`
        NatsModule, // Ensure `NATS_SERVICE` is available
    ],
    controllers: [UserController],
    providers: [UserService, UserRepository, RoomRepository],
    exports: [UserService, UserRepository], // Export `UserService` if needed elsewhere
})
export class UserModule {}
