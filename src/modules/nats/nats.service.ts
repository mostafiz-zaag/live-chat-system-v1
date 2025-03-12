import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class NatsService {
    constructor(
        @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
    ) {}

    async publish(subject: string, data: any): Promise<void> {
        await this.natsClient.emit(subject, data).toPromise();
    }
}
