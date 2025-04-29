import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @IsNotEmpty({ message: 'Username is required.' })
    @IsString({ message: 'Username must be a valid string.' })
    username: string;

    @IsNotEmpty({ message: 'Token is required.' })
    @IsString({ message: 'Token must be a valid string.' })
    token: string;
}
