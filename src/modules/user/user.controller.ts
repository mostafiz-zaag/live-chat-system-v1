// src/modules/user/user.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Role } from 'src/enums/user-role';
import { RequestAssistanceDto } from './dto/request-assistance.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly usersService: UserService) {}

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

    @Post('/agent/ready')
    async agentReady(@Body('username') username: string) {
        return this.usersService.agentJoinQueue(username);
    }

    @Get('/agents/all')
    async getAllAgents() {
        return {
            message: 'All agents fetched successfully.',
            agents: await this.usersService.getAllAgents(),
        };
    }
}
