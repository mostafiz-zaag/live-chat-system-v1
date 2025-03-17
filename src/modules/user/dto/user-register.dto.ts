import {
    IsArray,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';
import { Role } from '../../../enums/user-role';

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
    username?: string;

    // Allow multiple departments for Managers
    @ValidateIf((o) => o.role === Role.MANAGER)
    @IsArray({ message: 'Departments must be an array of strings.' })
    @IsNotEmpty({ message: 'Departments are required for managers.' })
    departments?: string[];

    @ValidateIf((o) => o.role === Role.MANAGER)
    @IsArray({ message: 'Languages must be an array of strings.' })
    @IsOptional()
    languages?: string[];

    @ValidateIf((o) => o.role === Role.AGENT)
    @IsString({ message: 'Language must be a valid string.' })
    @IsNotEmpty({ message: 'Language is required for agents.' })
    language?: string;

    @ValidateIf((o) => o.role === Role.AGENT)
    @IsNumber({}, { message: 'Manager ID must be a valid number.' })
    @IsNotEmpty({ message: 'Manager is required for agents.' })
    managerId: number;
}
