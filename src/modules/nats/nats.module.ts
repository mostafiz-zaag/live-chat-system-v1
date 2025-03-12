import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NatsService } from './nats.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'NATS_SERVICE', // Registers `NATS_SERVICE`
                transport: Transport.NATS,
                options: {
                    servers: ['nats://localhost:4222'],
                },
            },
        ]),
    ],
    providers: [NatsService],
    exports: [NatsService, ClientsModule], // Ensure NATS_SERVICE is exported for use in other modules
})
export class NatsModule {}
