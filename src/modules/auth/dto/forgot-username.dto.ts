import { IsNotEmpty } from 'class-validator';

export class ForgotUserNameDto {
    @IsNotEmpty()
    email: string;

    message?: string;
}
