import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountStatus } from 'src/enums/account-status.enum'; // Adjust the import path
import { AgentStatus, Role } from 'src/enums/user-role'; // Adjust the import path based on your project structure

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    password?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString({ each: true })
    languages?: string[];

    @IsOptional()
    @IsString({ each: true })
    departments?: string[];

    @IsOptional()
    @IsBoolean()
    isTemporaryPassword?: boolean;

    @IsOptional()
    @IsEnum(AgentStatus)
    status?: AgentStatus;

    @IsOptional()
    @IsEnum(AccountStatus)
    accountStatus?: AccountStatus;

    @IsOptional()
    @IsBoolean()
    is2FAEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    twoFAVerified?: boolean;

    @IsOptional()
    @IsBoolean()
    isRequested?: boolean;

    @IsOptional()
    @IsBoolean()
    isAssigned?: boolean;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    requestedType?: string; // Optional field for requested type

    // You can add other fields as needed
}
