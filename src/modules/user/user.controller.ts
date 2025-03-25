// src/modules/user/user.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

    // Manager endpoints
    @Get('/manager/all')
    async getAllManagers() {
        return {
            message: 'All managers fetched successfully.',
            managers: await this.usersService.getAllManagers(),
        };
    }
}
