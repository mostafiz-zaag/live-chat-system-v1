import { IsNotEmpty, IsString } from 'class-validator';

export class CheckTotpDto {
    @IsNotEmpty({ message: 'username is required.' })
    username: string;

    @IsString({ message: 'TOTP must be a valid string.' })
    @IsNotEmpty({ message: 'TOTP is required.' })
    token: string;
}
