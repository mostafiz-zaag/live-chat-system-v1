// src/modules/user/user.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { API_PREFIX, API_SECURED_PREFIX } from 'src/constants/project.constant';
import { Role } from 'src/enums/user-role';
import { ChatService } from '../chat/chat.service';
import { RequestAssistanceDto } from './dto/request-assistance.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserService } from './user.service';
import { PageRequest } from '../../common/dto/page-request.dto';

@Controller('/')
export class UserController {
    constructor(
        private readonly usersService: UserService,
        private readonly chatService: ChatService,
    ) {}

    @Post(`${API_PREFIX}/users/request-assistance`)
    async requestAssistance(@Body() dto: RequestAssistanceDto) {
        return this.usersService.requestAssistance(dto.userId, dto.language, dto.department, dto.initialMessage);
    }

    @Get(`${API_PREFIX}/users/queue-size`)
    async getQueueSize() {
        return this.usersService.getQueueSize();
    }

    @Get(`${API_PREFIX}/users/all`)
    async getAllUsers(@Query('role') role?: Role) {
        return this.usersService.getAllUsers(role);
    }

    @Patch(`${API_SECURED_PREFIX}/users/update/status/:id`)
    async updateUserStatus(@Param('id') id: number, @Query('status') status: boolean) {
        return this.usersService.updateUserStatus(id, status);
    }

    // Agent endpoints
    // @Post(`${API_PREFIX}/users/agent/ready`)
    // async agentReady(@Body('username') username: string) {
    //     return this.usersService.agentJoinQueue(username);
    // }

    // @Post(`${API_PREFIX}/users/agent/busy`)
    // async agentBusy(@Body('username') username: string) {
    //     return this.usersService.agentBusy(username);
    // }

    @Patch(`${API_PREFIX}/users/agent/status`)
    async setAgentStatus(
        @Query('id') id: string,
        @Query('ready') ready: boolean, // using string since query params are string by default
    ) {
        console.log(id, ready);
        if (ready === true) {
            return this.usersService.agentJoinQueue(+id);
        } else {
            return this.usersService.agentBusy(+id);
        }
    }

    @Get(`${API_PREFIX}/users/agents/all-busy`)
    async getAllBusyAgents() {
        return {
            message: 'All busy agents fetched successfully.',
            agents: await this.usersService.getAllBusyAgents(),
        };
    }

    // @Get(`${API_PREFIX}/users/agents/all`)
    // async getAllAgents() {
    //     return {
    //         message: 'All agents fetched successfully.',
    //         agents: await this.usersService.getAllAgents(),
    //     };
    // }

    @Get(`${API_PREFIX}/users/agents/all-ready`)
    async getAllReadyAgents() {
        return {
            message: 'All ready agents fetched successfully.',
            agents: await this.usersService.getAllReadyAgents(),
        };
    }

    @Post(`${API_PREFIX}/users/agent/finish-chat/:agentId/:roomId`)
    async finishChat(@Param('agentId') agentId: number, @Param('roomId') roomId: number) {
        return this.usersService.finishAgentChat(agentId, roomId);
    }

    //---------------------------- Admin panal: Manager access endpoints---------------------------
    @Get(`${API_SECURED_PREFIX}/users/manager/all`)
    async getAllManagers(@Query('name') name: string, @Query('isActive') isActive: boolean, @Query('page') page: number, @Query('size') size: number) {
        return await this.usersService.getAllManagers(name, isActive, new PageRequest(page, size));
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

    @Get(`${API_SECURED_PREFIX}/users/manager/chats/:managerId`)
    async getAgentsChatByManager(@Param('managerId') managerId: number) {
        return this.usersService.getAgentsChatByManager(managerId);
    }

    @Get(`${API_SECURED_PREFIX}/users/manager/rooms/:managerId`)
    async getAllRoomsByManager(
        @Param('managerId') managerId: number,
        @Query('agentName') agentName?: string, // Optional query parameter for agent name
    ) {
        const rooms = await this.usersService.getAllRoomsByManager(managerId, agentName);
        return rooms;
    }

    @Get(`${API_SECURED_PREFIX}/users/agents/manager/:managerId`)
    async getAllAgentNamesWithStatus(@Param('managerId') managerId: number) {
        const result = await this.usersService.getAllAgentNamesWithStatusByManager(managerId);
        return result;
    }

    // -------------------------------- Admin panal: Manager access endpoints end ---------------------------
    @Get(`${API_SECURED_PREFIX}/users/agents/all`)
    async getAllAgent(@Query('name') name: string, @Query('isActive') isActive: boolean, @Query('page') page: number, @Query('size') size: number) {
        return this.usersService.getAllAgents(name, isActive, new PageRequest(page, size));
    }

    // ------------------------------Agent endpoints--------------------------------

    @Get(`${API_SECURED_PREFIX}/users/agent/in-queue/:agentId`)
    async getAgentInQueue(@Param('agentId') agentId: number, @Query('page') page: number, @Query('size') size: number) {
        return await this.usersService.queueListForAgent(agentId, new PageRequest(page, size));
    }

    @Patch(`${API_SECURED_PREFIX}/users/update`)
    async updateUser(@Query('id') id: number, @Body() updateData: UpdateUserDto) {
        // Validate and update the user based on the provided data
        return this.usersService.updateUserDetails(+id, updateData);
    }
}
