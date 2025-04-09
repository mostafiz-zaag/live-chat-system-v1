import { IsNotEmpty } from 'class-validator';

export class LostMyDeviceDto {
    @IsNotEmpty()
    username: string;

    email?: string;
}
