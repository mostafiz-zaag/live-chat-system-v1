import { IsEnum, IsNotEmpty } from 'class-validator';
export enum SenderType {
    USER = 'user',
    AGENT = 'agent',
}

export class UploadFileDto {
    @IsNotEmpty({ message: 'Room ID is required.' })
    roomId: string;

    @IsNotEmpty({ message: 'Sender type is required.' })
    @IsEnum(SenderType, {
        message: 'Sender type must be either "user" or "agent".',
    })
    senderType: SenderType;
}
