import { IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    token: string;
}
