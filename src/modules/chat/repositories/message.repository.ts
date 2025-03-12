import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(private readonly dataSource: DataSource) {
    super(Message, dataSource.createEntityManager());
  }

  async saveMessage(roomId: number, sender: string, content: string): Promise<Message> {
    const message = this.create({ room: { id: roomId }, sender, content, timestamp: new Date() });
    return this.save(message);
  }

  async getChatHistory(roomId: number): Promise<Message[]> {
    return this.find({ where: { room: { id: roomId } }, order: { timestamp: 'ASC' } });
  }
}
