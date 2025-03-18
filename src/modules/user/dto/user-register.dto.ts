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

    // ✅ Allow multiple departments for Managers and Agents
    @ValidateIf((o) => o.role === Role.MANAGER || o.role === Role.AGENT)
    @IsArray({ message: 'Departments must be an array of strings.' })
    @IsNotEmpty({
        message: 'Departments are required for managers and agents.',
    })
    departments?: string[];

    // ✅ Allow multiple languages for Managers and Agents
    @ValidateIf((o) => o.role === Role.MANAGER || o.role === Role.AGENT)
    @IsArray({ message: 'Languages must be an array of strings.' })
    @IsNotEmpty({ message: 'Languages are required for managers and agents.' })
    languages?: string[];

    // ✅ Ensure `managerId` is required for Agents
    @ValidateIf((o) => o.role === Role.AGENT)
    @IsNumber({}, { message: 'Manager ID must be a valid number.' })
    @IsNotEmpty({ message: 'Manager is required for agents.' })
    managerId: number;
}
