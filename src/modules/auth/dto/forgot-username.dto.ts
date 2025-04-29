import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ForgotUserNameDto {
    @IsNotEmpty({ message: 'Email is required.' })
    @IsString({ message: 'Email must be a valid string.' })
    email: string;

    @IsOptional()
    @IsString({ message: 'Message must be a valid string if provided.' })
    message?: string;
}
