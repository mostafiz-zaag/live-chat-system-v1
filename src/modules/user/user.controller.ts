// src/modules/user/user.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from 'src/enums/user-role';
import { ChatService } from '../chat/chat.service';
import { RequestAssistanceDto } from './dto/request-assistance.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(
        private readonly usersService: UserService,
        private readonly chatService: ChatService,
    ) {}

    @Post('request-assistance')
    async requestAssistance(@Body() dto: RequestAssistanceDto) {
        return this.usersService.requestAssistance(
            dto.userId,
            dto.language,
            dto.department,
        );
    }

    @Get('/queue-size')
    async getQueueSize() {
        return this.usersService.getQueueSize();
    }

    @Get('/all')
    async getAllUsers(@Query('role') role?: Role) {
        return this.usersService.getAllUsers(role);
    }

    // Agent endpoints
    @Post('/agent/ready')
    async agentReady(@Body('username') username: string) {
        return this.usersService.agentJoinQueue(username);
    }

    @Post('/agent/busy')
    async agentBusy(@Body('username') username: string) {
        return this.usersService.agentBusy(username);
    }

    @Get('/agents/all-busy')
    async getAllBusyAgents() {
        return {
            message: 'All busy agents fetched successfully.',
            agents: await this.usersService.getAllBusyAgents(),
        };
    }

    @Get('/agents/all')
    async getAllAgents() {
        return {
            message: 'All agents fetched successfully.',
            agents: await this.usersService.getAllAgents(),
        };
    }

    @Get('/agents/all-ready')
    async getAllReadyAgents() {
        return {
            message: 'All ready agents fetched successfully.',
            agents: await this.usersService.getAllReadyAgents(),
        };
    }

    @Post('/agents/finish-chat')
    async finishChat(@Body('agentId') agentId: number) {
        return this.usersService.finishAgentChat(agentId);
    }

    // Admin panal: Manager access endpoints
    @Get('/manager/all')
    async getAllManagers() {
        return {
            message: 'All managers fetched successfully.',
            managers: await this.usersService.getAllManagers(),
        };
    }

    @Get('/manager/in-queue/:managerId')
    async getManagerQueue(@Param('managerId') managerId: number) {
        const queue = await this.usersService.queueListForManager(managerId);
        return {
            message: 'Manager queue fetched successfully.',
            queueSize: queue.length,
            queue,
        };
    }

    @Get('/manager/my-chats/:managerId')
    async getAgentsChatByManager(@Param('managerId') managerId: number) {
        return this.usersService.getAgentsChatByManager(managerId);
    }

    @Get('/agent/all')
    async getAllAgent() {
        return this.usersService.getAllAgents();
    }
}
