import { Injectable, Logger } from '@nestjs/common';
import { JetStreamClient, NatsConnection, consumerOpts } from 'nats';
import { AgentStatus } from '../../enums/user-role';
import { ChatService } from '../chat/chat.service';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class NatsHandlers {
    private js: JetStreamClient;
    private readonly logger = new Logger(NatsHandlers.name);

    constructor(
        private readonly nc: NatsConnection,
        private readonly chatService: ChatService,
        private readonly userRepository: UserRepository,
    ) {
        this.js = this.nc.jetstream();
        this.setupConsumers();
    }

    private async setupConsumers() {
        try {
            const userSub = await this.js.pullSubscribe(
                'user.request',
                consumerOpts().durable('user-queue-consumer'),
            );

            const agentSub = await this.js.pullSubscribe(
                'agent.ready',
                consumerOpts().durable('agent-queue-consumer'),
            );

            (async () => {
                for await (const msg of userSub) {
                    try {
                        const data = JSON.parse(msg.data.toString());
                        await this.handleUserRequest(data.userId, data.roomId);
                        msg.ack();
                    } catch (error) {
                        this.logger.error('Error handling user request', error);
                    }
                }
            })();

            (async () => {
                for await (const msg of agentSub) {
                    try {
                        const agentId = parseInt(msg.data.toString(), 10);
                        await this.handleAgentReady(agentId);
                        msg.ack();
                    } catch (error) {
                        this.logger.error('Error handling agent ready', error);
                    }
                }
            })();
        } catch (error) {
            this.logger.error('Error setting up consumers', error);
        }
    }

    private async handleUserRequest(userId: number, roomId: number) {
        try {
            const agent = await this.userRepository.findReadyAgent();

            if (agent) {
                await this.assignAgentToUser(agent.id, roomId, userId);
            } else {
                this.logger.log(`No ready agents available for User ${userId}`);
            }
        } catch (error) {
            this.logger.error(
                `Error handling user request for userId: ${userId}`,
                error,
            );
        }
    }

    private async handleAgentReady(agentId: number) {
        try {
            const waitingRoom = await this.chatService.getNextWaitingRoom();

            if (waitingRoom) {
                await this.assignAgentToUser(
                    agentId,
                    waitingRoom.id,
                    parseInt(waitingRoom.userId, 10),
                );
            } else {
                this.logger.log(
                    `No waiting users available for Agent ${agentId}`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Error handling agent ready for agentId: ${agentId}`,
                error,
            );
        }
    }

    private async assignAgentToUser(
        agentId: number,
        roomId: number,
        userId: number,
    ) {
        try {
            await this.chatService.assignAgent(roomId, agentId);

            await this.userRepository.update(agentId, {
                status: AgentStatus.BUSY, // ✅ Corrected enum usage clearly
                isAssigned: true,
            });

            this.logger.log(
                `Assigned Agent ${agentId} to User ${userId} in Room ${roomId}`,
            );
        } catch (error) {
            this.logger.error(
                `Error assigning agent ${agentId} to user ${userId}`,
                error,
            );
        }
    }
}
