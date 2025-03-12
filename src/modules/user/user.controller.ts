// src/modules/user/user.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly usersService: UserService) {}

    @Post('request-assistance')
    async requestAssistance(@Body('userId') userId: string) {
        return this.usersService.requestAssistance(userId);
    }

    @Get('queue-size')
    async getQueueSize() {
        return this.usersService.getQueueSize();
    }
}
