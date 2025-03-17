import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email: string;

    @IsString({ message: 'Old password must be a valid string.' })
    @IsNotEmpty({ message: 'Old password is required.' })
    oldPassword: string;

    @IsString({ message: 'New password must be a valid string.' })
    @MinLength(6, {
        message: 'New password must be at least 6 characters long.',
    })
    @IsNotEmpty({ message: 'New password is required.' })
    newPassword: string;

    @IsString({ message: 'Confirm password must be a valid string.' })
    @IsNotEmpty({ message: 'Confirm password is required.' })
    confirmPassword: string;
}
