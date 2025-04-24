import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LiteManagerDto {
    @IsOptional()
    id: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    username?: string;
}
