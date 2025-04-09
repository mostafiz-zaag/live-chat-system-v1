import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    UploadedFile,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { API_PREFIX } from 'src/constants/project.constant';
import { ChatService } from './chat.service';
import { LeaveAgentChatDto, LeaveChatDto } from './dto/leave-chat.dto';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('/')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    /**
     * User leaves the queue before being assigned to an agent.
     */

    @HttpCode(200)
    @Post(`${API_PREFIX}/chat/leave-queue`)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async leaveQueue(@Body() leaveChatDto: LeaveChatDto) {
        const userId = leaveChatDto.userId;
        console.log(
            `[LEAVE QUEUE] User ${userId} requested to leave the queue.`,
        );

        const chatRoom = await this.chatService.getWaitingRoomByUser(userId);

        if (!chatRoom) {
            return { message: `User ${userId} is not in the queue.` };
        }

        if (chatRoom.agentId) {
            chatRoom.userId = null;
            await this.chatService.updateRoom(chatRoom);
            return {
                message: `User ${userId} has left the chat room and is no longer in the queue.`,
            };
        }

        await this.chatService.deleteRoom(chatRoom.id);
        console.log(`[LEAVE QUEUE] User ${userId} removed from the queue.`);

        return {
            message: `User ${userId} successfully removed from the queue.`,
        };
    }

    @Post(`${API_PREFIX}/chat/leave-user-chat`)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async leaveUserChat(@Body() leaveChatDto: LeaveChatDto) {
        const userId = leaveChatDto.userId;
        console.log(
            `[LEAVE USER CHAT] User ${userId} requested to leave chat.`,
        );
        const result = await this.chatService.leaveUserChat(userId);
        return { message: result.message };
    }

    /**
     * Agent leaves an ongoing chat session.
     */
    @HttpCode(200)
    @Post(`${API_PREFIX}/chat/leave-agent-chat`)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async leaveAgentChat(@Body() leaveAgentChatDto: LeaveAgentChatDto) {
        console.log(
            `[LEAVE CHAT] Agent ${leaveAgentChatDto.agentId} is leaving the chat.`,
        );

        const result = await this.chatService.leaveAgentChat(
            +leaveAgentChatDto.agentId,
        );
        return {
            message: result.message,
            roomId: result.roomId,
            userId: result.userId,
        };
    }

    /**
     * Uploads a file to the chat session.
     */
    @Post(`${API_PREFIX}/file/upload-file`)
    @UseInterceptors(FileInterceptor('file'))
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadFileDto: UploadFileDto,
    ) {
        if (!file) {
            return { message: 'File upload failed. No file received.' };
        }

        console.log(
            `[UPLOAD FILE] Uploading file for room ${uploadFileDto.roomId}`,
        );
        const result = await this.chatService.uploadFile(
            file,
            uploadFileDto.roomId,
            uploadFileDto.senderType,
        );

        return {
            message: 'File uploaded successfully.',
            fileUrl: result.fileUrl,
            fileKey: result.fileKey,
        };
    }

    @Get(`${API_PREFIX}/my-chat/agent/:agentId`)
    async getAgentChatRooms(@Param('agentId') agentId: number) {
        const myChats = await this.chatService.getAssignedRooms(agentId);
        const inQueue = await this.chatService.getQueuedRooms();

        return {
            myChats,
            inQueue,
        };
    }

    @Get(`${API_PREFIX}/chat/history/:roomId`)
    async getChatHistory(@Param('roomId') roomId: number) {
        const chatHistory = await this.chatService.getChatHistory(roomId);
        return {
            message: 'Chat history fetched successfully.',
            chatHistory,
        };
    }
}
