import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { instrument } from '@socket.io/admin-ui';

@WebSocketGateway({
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly chatService: ChatService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    @WebSocketServer()
    server: Server;

    private activeUsers = new Map<string, { userId: string; role: 'user' | 'agent' }>();

    // File: src/modules/chat/chat.gateway.ts
    afterInit() {
        instrument(this.server, { auth: false });
        console.log('WebSocket server initialized');
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        this.activeUsers.delete(client.id);
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        console.log(`🔵 Received joinRoom event (RAW):`, data);

        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (error) {
                console.error(`❌ Error: Invalid JSON format.`, error);
                client.emit('error', { message: 'Invalid JSON format.' });
                return;
            }
        }

        if (!data.roomId || !data.userId) {
            console.error(`❌ Error: roomId and userId are required.`);
            client.emit('error', {
                message: 'roomId and userId are required.',
            });
            return;
        }

        const roomIdNum = parseInt(data.roomId, 10);
        if (isNaN(roomIdNum)) {
            console.error(`❌ Error: Invalid room ID format.`);
            client.emit('error', { message: 'Invalid room ID format.' });
            return;
        }

        const room = await this.chatService.getRoomById(roomIdNum);
        if (!room) {
            console.error(`❌ Error: Room ${roomIdNum} does not exist.`);
            client.emit('error', {
                message: `Room ${roomIdNum} does not exist.`,
            });
            return;
        }

        client.join(roomIdNum.toString());
        console.log(`📌 ${data.userId} joined room ${roomIdNum}`);

        client.emit('joinedRoom', {
            roomId: roomIdNum,
            message: `You joined room ${roomIdNum}`,
        });
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
        console.log('🔵 Received sendMessage event (RAW):', data);

        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (error) {
                console.error('❌ Error: Invalid JSON format.' + error);
                client.emit('error', { message: 'Invalid JSON format.' });
                return;
            }
        }

        const { roomId, sender, message } = data;

        if (!roomId || !sender || !message) {
            console.error('❌ Error: roomId, sender, and message are required.');
            client.emit('error', {
                message: 'roomId, sender, and message are required.',
            });
            return;
        }

        const roomIdStr = String(roomId);

        console.log(`📩 ${sender} sent message in room ${roomIdStr}: "${message}"`);

        const savedMessage = await this.chatService.saveMessage(Number(roomIdStr), sender, message);

        const createdAt = savedMessage.timestamp;

        this.server.to(roomIdStr).emit('newMessage', { sender, message, createdAt });

        client.emit('messageSent', { sender, message });
    }

    // @SubscribeMessage('getChatHistory')
    // async handleGetChatHistory(
    //     @ConnectedSocket() client: Socket,
    //     @MessageBody() data: any,
    // ) {
    //     if (typeof data === 'string') {
    //         try {
    //             data = JSON.parse(data);
    //         } catch (error) {
    //             console.error('❌ Error: Invalid JSON format.' + error);
    //             client.emit('error', { message: 'Invalid JSON format.' });
    //             return;
    //         }
    //     }
    //     const { roomId } = data;
    //
    //     if (!roomId) {
    //         client.emit('error', { message: 'roomId is required.' });
    //         return;
    //     }
    //
    //     const messages = await this.chatService.getChatHistory(roomId);
    //     client.emit('chatHistory', messages);
    //     console.log(`📜 Sent chat history for room ${roomId}`);
    // }

    // ✅ Listen for file upload events and broadcast them via WebSocket
    @OnEvent('file.uploaded')
    handleFileUploaded(payload: { roomId: string; fileUrl: string; senderType: string }) {
        console.log(`📢 Broadcasting file to room ${payload.roomId}: ${payload.fileUrl}`);

        if (this.server) {
            this.server.to(payload.roomId).emit('newMessage', {
                sender: payload.senderType,
                // message: `📎 File uploaded: ${payload.fileUrl}`,
                fileUrl: payload.fileUrl,
                createdAt: new Date(),
            });
        } else {
            console.error(`❌ WebSocket server is not initialized.`);
        }
    }
}
