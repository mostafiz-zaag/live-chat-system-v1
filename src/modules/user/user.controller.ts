// src/modules/user/user.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Role } from 'src/enums/user-role';
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

    @Get('/all')
    async getAllUsers(@Query('role') role?: Role) {
        return this.usersService.getAllUsers(role);
    }
}
