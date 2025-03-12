import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentModule } from '../agents/agent.module'; // Import AgentModule
import { ChatModule } from '../chat/chat.module';
import { NatsModule } from '../nats/nats.module';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        ChatModule, // Ensure ChatModule is imported for `ChatService`
        NatsModule, // Ensure `NATS_SERVICE` is available
        AgentModule, // Ensure AgentModule is imported for `AgentService`
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService], // Export `UserService` if needed elsewhere
})
export class UserModule {}
