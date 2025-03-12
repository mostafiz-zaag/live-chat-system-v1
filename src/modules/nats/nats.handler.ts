import { Injectable, Logger } from '@nestjs/common';
import { JetStreamClient, NatsConnection, consumerOpts } from 'nats';
import { ChatService } from '../chat/chat.service';
import { AgentRepository } from '../agents/agent.repository';

@Injectable()
export class NatsHandlers {
    private js: JetStreamClient;
    private readonly logger = new Logger(NatsHandlers.name);

    constructor(
        private readonly nc: NatsConnection,
        private readonly chatService: ChatService,
        private readonly agentRepository: AgentRepository,
    ) {
        this.js = this.nc.jetstream();
        this.setupConsumers();
    }

    private async setupConsumers() {
        try {
            // Consumer for user requests
            const userSub = await this.js.pullSubscribe(
                'user.request',
                consumerOpts().durable('user-queue-consumer'),
            );

            // Consumer for agent availability
            const agentSub = await this.js.pullSubscribe(
                'agent.ready',
                consumerOpts().durable('agent-queue-consumer'),
            );

            (async () => {
                for await (const msg of userSub) {
                    try {
                        const userId = msg.data.toString();
                        await this.handleUserRequest(userId);
                        msg.ack();
                    } catch (error) {
                        this.logger.error('Error handling user request', error);
                    }
                }
            })();

            (async () => {
                for await (const msg of agentSub) {
                    try {
                        const agentId = msg.data.toString();
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

    private async handleUserRequest(userId: string) {
        try {
            // Check if there is a ready agent
            const agentSub = await this.js.pullSubscribe(
                'agent.ready',
                consumerOpts().durable('agent-queue-consumer'),
            );

            // Fetch the next message from the agent subscription
            await agentSub.pull({ batch: 1 });
            for await (const msg of agentSub) {
                const agentId = msg.data.toString();
                await this.assignAgentToUser(agentId, userId);
                msg.ack();
            }
        } catch (error) {
            this.logger.error(
                `Error handling user request for userId: ${userId}`,
                error,
            );
        }
    }

    private async handleAgentReady(agentId: string) {
        try {
            // Check if there are users waiting
            const userSub = await this.js.pullSubscribe(
                'user.request',
                consumerOpts().durable('user-queue-consumer'),
            );

            // Fetch the next message from the user subscription
            await userSub.pull({ batch: 1 });
            for await (const msg of userSub) {
                const userId = msg.data.toString();
                await this.assignAgentToUser(agentId, userId);
                msg.ack();
            }
        } catch (error) {
            this.logger.error(
                `Error handling agent ready for agentId: ${agentId}`,
                error,
            );
        }
    }

    private async assignAgentToUser(agentId: string, userId: string) {
        try {
            // Assign agent to user's chat room
            const roomId = parseInt(userId, 10); // Convert userId to number
            await this.chatService.assignAgent(roomId, agentId);

            // Mark agent as busy
            await this.agentRepository.update({ agentId }, { status: 'busy' });

            // Notify user and agent (e.g., via WebSocket)
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
