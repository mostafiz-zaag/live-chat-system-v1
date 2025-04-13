// import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
// import { AgentService } from './agent.service';
// import { AgentStatusDto } from './dto/agent.dto';

// @Controller('agents')
// export class AgentController {
//     constructor(private readonly agentService: AgentService) {}

//     @Post('ready')
//     async joinQueue(@Body() agentStatusDto: AgentStatusDto) {
//         return this.agentService.joinQueue(agentStatusDto.name);
//     }

//     @Post('busy')
//     async markAgentBusy(@Body() agentStatusDto: AgentStatusDto) {
//         return this.agentService.markAgentBusy(agentStatusDto.agentId);
//     }

//     @Post('finish-chat')
//     async finishChat(@Body() agentStatusDto: AgentStatusDto) {
//         return this.agentService.finishChat(agentStatusDto.agentId);
//     }

//     @Get('all-ready-agents')
//     async getAgents() {
//         return this.agentService.getAllReadyAgents();
//     }

//     @Get('all')
//     async getAllAgents() {
//         return this.agentService.getAllAgents();
//     }

//     @Put(':agentId/status')
//     async updateAgentStatus(
//         @Param('agentId') agentId: string,
//         @Body() agentStatusDto: AgentStatusDto,
//     ) {
//         return this.agentService.updateAgentStatus(
//             agentId,
//             agentStatusDto.status,
//         );
//     }

//     @Get(':agentId')
//     async getAgentById(@Param('agentId') agentId: string) {
//         return this.agentService.getAgentById(agentId);
//     }
// }
