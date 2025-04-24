import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AgentStatus, Role } from 'src/enums/user-role';
import { ChatService } from '../chat/chat.service';
import { MessageRepository } from '../chat/repositories/message.repository';
import { RoomRepository } from '../chat/repositories/room.repository';
import { NatsService } from '../nats/nats.service';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { UserRepository } from './user.repository';
import { PageRequest } from '../../common/dto/page-request.dto';
import { UserSpecification } from './user.specification.dto';
import { createCustomPaginatedResponse, createPaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService {
    constructor(
        @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
        private readonly chatService: ChatService,
        private readonly natsService: NatsService,
        private readonly userRepository: UserRepository,
        private readonly roomRepository: RoomRepository,
        private readonly messageRepository: MessageRepository,
    ) {}

    // user.service.ts
    // async requestAssistance(
    //     userId: string, // This is the guest userId (e.g., "hi")
    //     language: string,
    //     department: string,
    // ) {
    //     console.log(userId, language, department);
    //
    //     // Step 1: Create a new room for the user
    //     const chatRoom = await this.roomRepository.createRoomForUser(
    //         userId, // Pass guest userId (e.g., "hi")
    //         language,
    //         department,
    //     );
    //
    //     console.log('Chat room created: ', chatRoom);
    //
    //     // Step 2: Find an available agent who can handle the request
    //     const agent = await this.userRepository.findReadyUnassignedAgent(
    //         language,
    //         department,
    //     );
    //
    //     console.log('Agent found: ', agent);
    //
    //     if (agent) {
    //         // Step 3: Assign the agent to the room
    //         await this.roomRepository.assignAgentToRoom(chatRoom.id, agent.id);
    //
    //         // Increase the agent's active chat count
    //         agent.activeChatCount += 1;
    //         agent.isAssigned = true;
    //
    //         // Save the updated agent data
    //         await this.userRepository.save(agent);
    //
    //         // Emit the agent assignment event (e.g., notifying the system)
    //         await this.natsClient
    //             .emit('agent.assigned', {
    //                 agentId: agent.id,
    //                 roomId: chatRoom.id,
    //             })
    //             .toPromise();
    //
    //         return {
    //             message: `Agent ${agent.username} auto-assigned to room ${chatRoom.id}`,
    //             room: chatRoom,
    //         };
    //     } else {
    //         // If no agent is available, add the user to the queue and wait for an agent
    //         await this.natsClient
    //             .emit('user.request', {
    //                 userId, // Pass the guest userId (e.g., "hi")
    //                 roomId: chatRoom.id,
    //                 language,
    //                 department,
    //             })
    //             .toPromise();
    //
    //         return {
    //             message: 'No unassigned agent available. You have been queued.',
    //             room: chatRoom,
    //         };
    //     }
    // }

    async requestAssistance(userId: string, language: string, department: string, initialMessage?: string) {
        // generate a random userId if not provided
        if (!userId) {
            userId = Math.random().toString(36).substring(2, 10); // Generate a random string
        }

        const chatRoom = await this.roomRepository.createRoomForUser(userId, language, department, initialMessage);

        // ✅ Save the initial message as first chat message
        // if (initialMessage) {
        //     await this.messageRepository.save({
        //         room: chatRoom, // Use the full Room entity
        //         sender: 'user',
        //         content: initialMessage,
        //         timestamp: new Date(),
        //     });
        // }

        console.log('Room created: Here', chatRoom);

        const agent = await this.userRepository.findReadyUnassignedAgent(language, department);

        if (agent) {
            await this.roomRepository.assignAgentToRoom(chatRoom.id, agent.id);
            agent.activeChatCount += 1;
            agent.isAssigned = true;
            await this.userRepository.save(agent);

            await this.natsClient
                .emit('agent.assigned', {
                    agentId: agent.id,
                    roomId: chatRoom.id,
                })
                .toPromise();

            return {
                message: `Agent ${agent.username} auto-assigned to room ${chatRoom.id}`,
                room: chatRoom,
            };
        } else {
            await this.natsClient
                .emit('user.request', {
                    userId,
                    roomId: chatRoom.id,
                    language,
                    department,
                    initialMessage,
                })
                .toPromise();

            return {
                message: 'No unassigned agent available. You have been queued.',
                room: chatRoom,
            };
        }
    }

    async getQueueSize() {
        return await this.chatService.getWaitingUsers();
    }

    async updateUserStatus(id: number, status: boolean) {
        const user = await this.userRepository.findById(id);
        console.log('User found: ', user);
        if (!user) throw new NotFoundException(`User not found.`);

        user.isActive = status;
        await this.userRepository.save(user);

        return {
            message: `User ${user.username} status updated to ${user.isActive}.`,
        };
    }

    async getAllUsers(role?: Role) {
        if (role) {
            return this.userRepository.find({ where: { role } });
        }
        return this.userRepository.find();
    }

    async allRequestForActiveUsers(requestType: string, pageRequest: PageRequest) {
        const queryBuilder = this.userRepository.createQueryBuilder('user');

        UserSpecification.distinctUsers(queryBuilder);
        UserSpecification.matchType(queryBuilder, requestType);
        UserSpecification.isRequested(queryBuilder, true);

        const [users, total] = await queryBuilder
            .orderBy('user.id', 'DESC')
            .skip(pageRequest.page * pageRequest.size)
            .take(pageRequest.size)
            .getManyAndCount();

        return createPaginatedResponse(users, total, pageRequest);
    }

    async agentJoinQueue(id: number) {
        const agent = await this.userRepository.findById(id);
        if (!agent) throw new NotFoundException(`agent not found.`);

        if (agent.status === AgentStatus.READY) {
            return {
                message: `Agent: ${agent.username} is already ready.`,
            };
        }

        await this.userRepository.updateAgentStatus(agent.id, AgentStatus.READY);

        const queuedRoom = await this.roomRepository.findUnassignedRoom();

        if (queuedRoom) {
            await this.roomRepository.assignAgentToRoom(queuedRoom.id, agent.id);
            agent.activeChatCount += 1;
            agent.isAssigned = true;
            await this.userRepository.save(agent);

            await this.natsClient
                .emit('agent.assigned', {
                    agentId: agent.id,
                    roomId: queuedRoom.id,
                })
                .toPromise();

            return {
                username: agent.username,
                roomNo: queuedRoom.id,
                message: `Agent ${agent.username} assigned to roomNo: '${queuedRoom.id}'`,
            };
        }

        return { message: `Agent ${agent.username} is now ready.` };
    }

    async agentBusy(id: number) {
        const agent = await this.userRepository.findById(id);

        if (!agent) throw new NotFoundException(`${agent.username} not found.`);

        await this.userRepository.updateAgentStatus(agent.id, AgentStatus.BUSY);

        return {
            message: `Agent: ${agent.username} is now busy.`,
        };
    }

    async finishAgentChat(agentId: number, roomId: number) {
        const agent = await this.userRepository.findOne({
            where: { id: agentId, role: Role.AGENT },
        });

        const room = await this.roomRepository.getRoomById(roomId);

        room.active = false;

        await this.roomRepository.save(room);

        if (!agent) throw new NotFoundException(`Agent ${agentId} not found.`);

        agent.activeChatCount = Math.max(agent.activeChatCount - 1, 0);
        agent.isAssigned = agent.activeChatCount > 0;
        await this.userRepository.save(agent);

        const queuedRoom = await this.roomRepository.findUnassignedRoom();
        if (queuedRoom && agent.activeChatCount === 0) {
            await this.roomRepository.assignAgentToRoom(queuedRoom.id, agentId);
            agent.activeChatCount += 1;
            agent.isAssigned = true;
            await this.userRepository.save(agent);

            await this.natsClient.emit('agent.assigned', { agentId, roomId: queuedRoom.id }).toPromise();

            return { message: `Agent reassigned to room ${queuedRoom.id}.` };
        }

        return {
            message: agent.isAssigned ? 'Agent finished one chat but still active.' : 'Agent is ready (no room available).',
        };
    }

    async getAllAgents(name: string, isActive: boolean, pageRequest: PageRequest) {
        const queryBuilder = this.userRepository.createQueryBuilder('user').leftJoinAndSelect('user.manager', 'manager');

        UserSpecification.distinctUsers(queryBuilder);
        UserSpecification.matchName(queryBuilder, name);
        UserSpecification.matchStatus(queryBuilder, isActive);
        UserSpecification.matchRole(queryBuilder, Role.AGENT);

        const [users, total] = await queryBuilder
            .orderBy('user.id', 'DESC')
            .skip(pageRequest.page * pageRequest.size)
            .take(pageRequest.size)
            .getManyAndCount();

        return createPaginatedResponse(
            users.map((user) => {
                return user.getDto();
            }),
            total,
            pageRequest,
        );
    }

    async getAllReadyAgents() {
        return this.userRepository.find({
            where: { role: Role.AGENT, status: AgentStatus.READY },
        });
    }

    async getAllBusyAgents() {
        return this.userRepository.find({
            where: { role: Role.AGENT, status: AgentStatus.BUSY },
        });
    }

    // get all manager with relation agent
    async getAllManagers(name: string, isActive: boolean, pageRequest: PageRequest) {
        // const managers = await this.userRepository.getAllManagers();

        const queryBuilder = this.userRepository.createQueryBuilder('user');

        UserSpecification.distinctUsers(queryBuilder);
        UserSpecification.matchName(queryBuilder, name);
        UserSpecification.matchStatus(queryBuilder, isActive);
        UserSpecification.matchRole(queryBuilder, Role.MANAGER);

        // Load agents relation
        queryBuilder.leftJoinAndSelect('user.agents', 'agent');

        const [users, total] = await queryBuilder
            .orderBy('user.id', 'DESC')
            .skip(pageRequest.page * pageRequest.size)
            .take(pageRequest.size)
            .getManyAndCount();

        // // Map over the managers and agents to filter out sensitive information
        // const filteredManagers = managers.map((manager) => {
        //     // Remove sensitive fields
        //     const { password, twoFASecret, otp, resetToken, ...managerData } =
        //         manager;
        //
        //     // Filter agents as well
        //     const filteredAgents = manager.agents?.map((agent) => {
        //         const { password, twoFASecret, otp, resetToken, ...agentData } =
        //             agent;
        //         return agentData; // Return filtered agent data without sensitive information
        //     });
        //
        //     return { ...managerData, agents: filteredAgents }; // Return manager data without sensitive fields
        // });

        return createPaginatedResponse(
            users.map((user) => {
                return user.getDto();
            }),
            total,
            pageRequest,
        );
    }

    async queueListForManager(managerId: number) {
        const manager = await this.userRepository.findById(managerId);
        if (manager.role !== 'manager') throw new NotFoundException(`Manager not found.`);

        const queue = await this.getQueueSize();

        // check manager languages and departments are match with queue languages and departments
        const filteredQueue = queue.waitingRooms.filter((room) => {
            return manager.languages.includes(room.language) && manager.departments.includes(room.department);
        });

        return filteredQueue;
    }

    // async queueListForAgent(agentId: number, pageRequest: PageRequest) {
    //     const agent = await this.userRepository.findById(agentId);
    //     console.log('Agent found: ', agent);
    //     if (agent.role !== 'agent') throw new NotFoundException(`Agent not found.`);
    //
    //     const queue = await this.getQueueSize();
    //
    //     if (agent.departments == null || agent.languages == null) {
    //         throw new BadRequestException(`Agent ${agent.username} has no assigned departments or languages.`);
    //     }
    //
    //     // check agent languages and departments are match with queue languages and departments
    //     const filteredQueue = queue.waitingRooms.filter((room) => {
    //         return agent.languages.includes(room.language) && agent.departments.includes(room.department);
    //     });
    //
    //     return filteredQueue;
    // }

    async queueListForAgent(agentId: number, pageRequest: PageRequest) {
        const agent = await this.userRepository.findById(agentId);
        console.log('Agent found: ', agent);

        if (agent.role !== 'agent') throw new NotFoundException(`Agent not found.`);

        const queue = await this.getQueueSize();

        if (agent.departments == null || agent.languages == null) {
            throw new BadRequestException(`Agent ${agent.username} has no assigned departments or languages.`);
        }

        // Filter rooms based on agent's languages and departments
        const filteredQueue = queue.waitingRooms.filter((room) => {
            return agent.languages.includes(room.language) && agent.departments.includes(room.department);
        });

        // Calculate pagination details
        const total = filteredQueue.length;
        const totalPages = Math.ceil(total / pageRequest.size);
        const startIndex = pageRequest.page * pageRequest.size; // Ensure startIndex is calculated correctly
        const endIndex = startIndex + pageRequest.size;

        // Get the paginated rooms (slice filteredQueue array)
        const paginatedQueue = filteredQueue.slice(startIndex, endIndex);

        // Return paginated response
        return createCustomPaginatedResponse(paginatedQueue, total, pageRequest);
    }

    async getAgentsChatByManager(managerId: number) {
        const manager = await this.userRepository.findOne({
            where: { id: managerId, role: Role.MANAGER },
            relations: ['agents'], // Fetch agents under the manager
        });

        if (!manager) {
            throw new NotFoundException(`Manager with ID ${managerId} not found.`);
        }

        const agents = manager.agents; // Get all agents for this manager

        // Fetch all rooms assigned to the agents
        const agentRooms = [];

        for (const agent of agents) {
            const rooms = await this.roomRepository.find({
                where: { agentId: agent.id }, // Fetch rooms assigned to this agent
                relations: ['user'],
            });

            // For each room, get the last message, first message time, and user details
            const roomWithDetails = [];

            for (const room of rooms) {
                // Get the latest (last) message from the room
                const lastMessage = await this.messageRepository.findOne({
                    where: { room: { id: room.id } },
                    order: { timestamp: 'DESC' }, // Get the last message by timestamp
                });

                // Get the first message (earliest) from the room
                const firstMessage = await this.messageRepository.findOne({
                    where: { room: { id: room.id } },
                    order: { timestamp: 'ASC' }, // Get the first message by timestamp
                });

                roomWithDetails.push({
                    roomId: room.id,
                    userId: room.userId, // The userId of the person in the room
                    lastMessage: lastMessage ? lastMessage.content : 'No messages yet', // Last message content
                    firstMessageTime: firstMessage ? firstMessage.timestamp : null, // Timestamp of the first message
                });
            }

            agentRooms.push({
                agentId: agent.id,
                agentName: agent.username,
                rooms: roomWithDetails, // Rooms with last messages and first message time
            });
        }

        return {
            message: `Chats for agents under Manager ${managerId} fetched successfully.`,
            agentRooms,
        };
    }

    async getAllRoomsByManager(managerId: number, agentName?: string) {
        const manager = await this.userRepository.findOne({
            where: { id: managerId, role: Role.MANAGER },
            relations: ['agents'], // Fetch agents under the manager
        });

        if (!manager) {
            throw new NotFoundException(`Manager with ID ${managerId} not found.`);
        }

        const agents = manager.agents; // Get all agents for this manager

        // If an agent name is provided, filter the agents by name
        const filteredAgents = agentName ? agents.filter((agent) => agent.username.toLowerCase() === agentName.toLowerCase()) : agents;

        if (filteredAgents.length === 0) {
            throw new NotFoundException(`No agents found with the name: ${agentName}`);
        }

        // Fetch all rooms assigned to the filtered agents
        const allRooms = [];

        for (const agent of filteredAgents) {
            const rooms = await this.roomRepository.find({
                where: { agentId: agent.id }, // Fetch rooms assigned to this agent
                relations: ['user'],
            });

            // For each room, get the last message, first message time, and user details
            for (const room of rooms) {
                // Get the latest (last) message from the room
                const lastMessage = await this.messageRepository.findOne({
                    where: { room: { id: room.id } },
                    order: { timestamp: 'DESC' }, // Get the last message by timestamp
                });

                // Get the first message (earliest) from the room
                const firstMessage = await this.messageRepository.findOne({
                    where: { room: { id: room.id } },
                    order: { timestamp: 'ASC' }, // Get the first message by timestamp
                });

                allRooms.push({
                    roomId: room.id,
                    userId: room.userId, // The userId of the person in the room
                    lastMessage: lastMessage ? lastMessage.content : 'No messages yet', // Last message content
                    firstMessageTime: firstMessage ? firstMessage.timestamp : null, // Timestamp of the first message
                });
            }
        }

        return {
            message: `Rooms for agents under Manager ${managerId} fetched successfully.`,
            rooms: allRooms, // Return all rooms assigned to this manager's agents
        };
    }

    async getMessagesByRoomId(roomId: number) {
        // Check if the room exists
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });

        if (!room) {
            throw new Error(`Room with ID ${roomId} not found.`);
        }

        // Fetch all messages for the given roomId
        const messages = await this.messageRepository.find({
            where: { room: { id: roomId } },
            order: { timestamp: 'ASC' }, // Optional: Order messages by timestamp (ascending)
        });

        return messages;
    }

    async getAllAgentNamesWithStatusByManager(managerId: number) {
        const manager = await this.userRepository.findOne({
            where: { id: managerId, role: Role.MANAGER },
            relations: ['agents'], // Fetch agents under the manager
        });

        if (!manager) {
            throw new NotFoundException(`Manager with ID ${managerId} not found.`);
        }

        // Fetch the agent's username and status
        const agentsWithStatus = manager.agents.map((agent) => ({
            username: agent.username,
            status: agent.status, // Agent's current status
        }));

        return {
            message: `Agent names and statuses for Manager ${managerId} fetched successfully.`,
            agentsWithStatus, // Return the list of agents with their status
        };
    }

    // ///
    // async createFAQByAgent(agentId: number, sentence: string) {
    //     const agent = await this.userRepository.findOne({
    //         where: { id: agentId, role: Role.AGENT },
    //     });
    //     if (!agent) {
    //         throw new NotFoundException(`Agent with ID ${agentId} not found.`);
    //     }

    //     if (!agent.faqs) {
    //         agent.faqs = []; // Initialize faqs if not already
    //     }

    //     agent.faqs.push(sentence); // Assuming agent.faqs is an array
    //     await this.userRepository.save(agent); // Save the updated agent data

    //     return {
    //         message: `FAQ created successfully by Agent ${agent.username}.`,
    //     };
    // }

    // async getAllFAQsByAgent(agentId: number) {
    //     const agent = await this.userRepository.findOne({
    //         where: { id: agentId, role: Role.AGENT },
    //     });
    //     if (!agent) {
    //         throw new NotFoundException(`Agent with ID ${agentId} not found.`);
    //     }

    //     return {
    //         message: `FAQs retrieved successfully for Agent ${agent.username}.`,
    //         faqs: agent.faqs, // Return the FAQs associated with the agent
    //     };
    // }

    async updateUserDetails(id: number, updateData: UpdateUserDto) {
        // Fetch the user by ID
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found.`);
        }

        // Update only the fields that are provided in the DTO
        if (updateData.username) {
            user.username = updateData.username;
        }

        if (updateData.email) {
            user.email = updateData.email;
        }

        if (updateData.password) {
            user.password = updateData.password;
        }

        if (updateData.role) {
            user.role = updateData.role;
        }

        if (updateData.isActive !== undefined) {
            user.isActive = updateData.isActive;
        }

        if (updateData.languages) {
            user.languages = updateData.languages;
        }

        if (updateData.departments) {
            user.departments = updateData.departments;
        }

        if (updateData.status) {
            user.status = updateData.status;
        }

        if (updateData.accountStatus) {
            user.accountStatus = updateData.accountStatus;
        }

        if (updateData.is2FAEnabled !== undefined) {
            user.is2FAEnabled = updateData.is2FAEnabled;
        }

        if (updateData.twoFAVerified !== undefined) {
            user.twoFAVerified = updateData.twoFAVerified;
        }

        if (updateData.isRequested !== undefined) {
            user.isRequested = updateData.isRequested;
        }

        if (updateData.isAssigned !== undefined) {
            user.isAssigned = updateData.isAssigned;
        }

        if (updateData.requestedType !== undefined) {
            user.requestedType = updateData.requestedType;
        }

        if (updateData.message) {
            user.message = updateData.message;
        }

        // Save the updated user back to the database
        await this.userRepository.save(user);

        return {
            message: 'User details updated successfully.',
            // user,
        };
    }

    async findUserById(id: number) {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found.`);
        }
        return user;
    }

    async updateStatus(id: number, status: boolean) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new NotFoundException(`User not found.`);

        if (status == true) {
            user.status = AgentStatus.READY;
        } else {
            user.status = AgentStatus.BUSY;
        }

        await this.userRepository.save(user);
    }

    async updateRequestStatus(id: number, accept: boolean) {
        const user = await this.userRepository.findById(id);

        if (!user) throw new NotFoundException(`User not found.`);

        if (accept) {
            user.isRequested = false;
            user.isActive = true;
            user.accountStatus = 'active';
        } else {
            user.isRequested = false;
            user.isActive = false;
            user.accountStatus = 'inactive';
        }

        const ans = await this.userRepository.save(user);

        console.log('User updated: ', ans);
        return {
            message: `User ${user.username} request status updated to ${accept ? 'accepted' : 'rejected'}.`,
        };
    }
}
