import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
} from 'class-validator';
import { AgentStatus, Role } from '../../../enums/user-role';

export class UserRegisterDto {
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email: string;

    @IsString({ message: 'Password must be a valid string.' })
    @IsOptional()
    password?: string;

    @IsEnum(Role, { message: 'Role must be admin, manager, or agent.' })
    @IsNotEmpty({ message: 'Role is required.' })
    role: Role;

    @ValidateIf((o) => o.role !== Role.ADMIN)
    @IsString({ message: 'Username must be a valid string.' })
    @IsNotEmpty({ message: 'Username is required for managers and agents.' })
    @MinLength(3, { message: 'Username must be at least 3 characters long.' })
    @MaxLength(16, { message: 'Username must not exceed 16 characters.' })
    username?: string;

    // Departments required for MANAGER and AGENT
    @ValidateIf((o) => o.role === Role.MANAGER || o.role === Role.AGENT)
    @IsArray({ message: 'Departments must be an array of strings.' })
    @ArrayNotEmpty({ message: 'At least one department is required.' })
    departments?: string[];

    // Languages required for MANAGER and AGENT
    @ValidateIf((o) => o.role === Role.MANAGER || o.role === Role.AGENT)
    @IsArray({ message: 'Languages must be an array of strings.' })
    @ArrayNotEmpty({ message: 'At least one language is required.' })
    languages?: string[];

    @ValidateIf((o) => o.role === Role.AGENT)
    @IsEnum(AgentStatus, {
        message: 'Status must be either busy or available.',
    })
    @IsOptional()
    status?: AgentStatus = AgentStatus.BUSY;

    @ValidateIf((o) => o.role === Role.AGENT)
    @IsBoolean({ message: 'isAssigned must be a boolean.' })
    @IsOptional()
    isAssigned?: boolean = false;

    // Manager ID required for AGENT only
    @ValidateIf((o) => o.role === Role.AGENT)
    @IsNumber({}, { message: 'Manager ID must be a valid number.' })
    @IsNotEmpty({ message: 'Manager is required for agents.' })
    managerId?: number;
}
