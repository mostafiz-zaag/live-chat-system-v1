import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveChatDto {
    @IsNotEmpty({ message: 'User ID is required.' })
    @IsString({ message: 'User ID must be a string.' })
    userId: string;
}

export class LeaveAgentChatDto {
    @IsNotEmpty({ message: 'Agent ID is required.' })
    @IsString({ message: 'Agent ID must be a string.' })
    agentId: string;
}
