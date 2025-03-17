import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email: string;

    @IsString({ message: 'OTP must be a valid string.' })
    @IsNotEmpty({ message: 'OTP is required.' })
    @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
    otp: string;
}
