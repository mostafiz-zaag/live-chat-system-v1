// src/modules/user/dto/request-assistance.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestAssistanceDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    language: string;

    @IsNotEmpty()
    @IsString()
    department: string;
}
