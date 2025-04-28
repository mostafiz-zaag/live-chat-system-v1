import { IsOptional } from 'class-validator';

export class UpdateAgentDto {
    @IsOptional()
    email?: string;

    @IsOptional()
    departments?: string[];

    @IsOptional()
    languages?: string[];

    @IsOptional()
    managerId?: number;
}
