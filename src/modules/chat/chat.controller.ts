import {
    Body,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { LeaveAgentChatDto, LeaveChatDto } from './dto/leave-chat.dto';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    /**
     * User leaves the queue before being assigned to an agent.
     */
    @Post('leave-queue')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async leaveQueue(@Body() leaveChatDto: LeaveChatDto) {
        const { userId } = leaveChatDto;
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
        console.log(
            `[LEAVE QUEUE] User ${userId} removed from the queue. Room ${chatRoom.id} deleted.`,
        );

        return {
            message: `User ${userId} successfully removed from the queue.`,
        };
    }

    /**
     * User leaves an ongoing chat session.
     */
    @Post('leave-user-chat')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async leaveUserChat(@Body() leaveChatDto: LeaveChatDto) {
        console.log(
            `[LEAVE USER CHAT] User ${leaveChatDto.userId} requested to leave chat.`,
        );

        const result = await this.chatService.leaveUserChat(
            leaveChatDto.userId,
        );
        return { message: result.message };
    }

    /**
     * Agent leaves an ongoing chat session.
     */
    @Post('leave-agent-chat')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async leaveAgentChat(@Body() leaveAgentChatDto: LeaveAgentChatDto) {
        console.log(
            `[LEAVE CHAT] Agent ${leaveAgentChatDto.agentId} is leaving the chat.`,
        );

        const result = await this.chatService.leaveAgentChat(
            leaveAgentChatDto.agentId,
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
    @Post('upload')
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
}
