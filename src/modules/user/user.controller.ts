// src/modules/user/user.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { API_PREFIX } from 'src/constants/project.constant';
import { Role } from 'src/enums/user-role';
import { ChatService } from '../chat/chat.service';
import { RequestAssistanceDto } from './dto/request-assistance.dto';
import { UserService } from './user.service';

@Controller('/')
export class UserController {
    constructor(
        private readonly usersService: UserService,
        private readonly chatService: ChatService,
    ) {}

    @Post(`${API_PREFIX}/users/request-assistance`)
    async requestAssistance(@Body() dto: RequestAssistanceDto) {
        return this.usersService.requestAssistance(
            dto.userId,
            dto.language,
            dto.department,
        );
    }

    @Get(`${API_PREFIX}/users/queue-size`)
    async getQueueSize() {
        return this.usersService.getQueueSize();
    }

    @Get(`${API_PREFIX}/users/all`)
    async getAllUsers(@Query('role') role?: Role) {
        return this.usersService.getAllUsers(role);
    }

    // Agent endpoints
    @Post(`${API_PREFIX}/users/agent/ready`)
    async agentReady(@Body('username') username: string) {
        return this.usersService.agentJoinQueue(username);
    }

    @Post(`${API_PREFIX}/users/agent/busy`)
    async agentBusy(@Body('username') username: string) {
        return this.usersService.agentBusy(username);
    }

    @Get(`${API_PREFIX}/users/agents/all-busy`)
    async getAllBusyAgents() {
        return {
            message: 'All busy agents fetched successfully.',
            agents: await this.usersService.getAllBusyAgents(),
        };
    }

    @Get(`${API_PREFIX}/users/agents/all`)
    async getAllAgents() {
        return {
            message: 'All agents fetched successfully.',
            agents: await this.usersService.getAllAgents(),
        };
    }

    @Get(`${API_PREFIX}/users/agents/all-ready`)
    async getAllReadyAgents() {
        return {
            message: 'All ready agents fetched successfully.',
            agents: await this.usersService.getAllReadyAgents(),
        };
    }

    @Post(`${API_PREFIX}/users/agent/finish-chat`)
    async finishChat(@Body('agentId') agentId: number) {
        return this.usersService.finishAgentChat(agentId);
    }

    //---------------------------- Admin panal: Manager access endpoints---------------------------
    @Get(`${API_PREFIX}/users/manager/all`)
    async getAllManagers() {
        return {
            message: 'All managers fetched successfully.',
            managers: await this.usersService.getAllManagers(),
        };
    }

    @Get(`${API_PREFIX}/users/manager/in-queue/:managerId`)
    async getManagerQueue(@Param('managerId') managerId: number) {
        const queue = await this.usersService.queueListForManager(managerId);
        return {
            message: 'Manager queue fetched successfully.',
            queueSize: queue.length,
            queue,
        };
    }

    @Get(`${API_PREFIX}/users/manager/chats/:managerId`)
    async getAgentsChatByManager(@Param('managerId') managerId: number) {
        return this.usersService.getAgentsChatByManager(managerId);
    }

    @Get(`${API_PREFIX}/users/manager/rooms/:managerId`)
    async getAllRoomsByManager(
        @Param('managerId') managerId: number,
        @Query('agentName') agentName?: string, // Optional query parameter for agent name
    ) {
        const rooms = await this.usersService.getAllRoomsByManager(
            managerId,
            agentName,
        );
        return rooms;
    }

    @Get(`${API_PREFIX}/users/agents/manager/:managerId`)
    async getAllAgentNamesWithStatus(@Param('managerId') managerId: number) {
        const result =
            await this.usersService.getAllAgentNamesWithStatusByManager(
                managerId,
            );
        return result;
    }

    // -------------------------------- Admin panal: Manager access endpoints end ---------------------------
    @Get(`${API_PREFIX}/users/agents/all`)
    async getAllAgent() {
        return this.usersService.getAllAgents();
    }
}
