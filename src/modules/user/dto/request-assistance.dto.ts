// request-assistance.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestAssistanceDto {
    @IsString({ message: 'userId must be a string' })
    userId: string;

    @IsString({ message: 'language must be a string' })
    @IsNotEmpty({ message: 'language is required' })
    language: string;

    @IsString({ message: 'department must be a string' })
    @IsNotEmpty({ message: 'department is required' })
    department: string;

    @IsString()
    @IsOptional()
    initialMessage: string; // Optional field for initial message
}
