import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LostMyDeviceDto {
    @IsNotEmpty({ message: 'Username must not be empty.' })
    @IsString({ message: 'Username must be a string.' })
    username: string;

    @IsOptional()
    @IsString({ message: 'Email must be a string if provided.' })
    email?: string;
}
