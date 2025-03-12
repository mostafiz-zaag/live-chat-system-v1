import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class AgentStatusDto {
    @IsNotEmpty({ message: 'Agent ID is required.' })
    @IsOptional()
    agentId: string;

    @IsNotEmpty({ message: 'Name is required.' })
    name: string;

    @IsNotEmpty({ message: 'Status is required.' })
    @IsEnum(['ready', 'busy', 'offline'], {
        message: 'Status must be "ready", "busy", or "offline".',
    })
    @IsOptional()
    status: 'ready' | 'busy';
}
