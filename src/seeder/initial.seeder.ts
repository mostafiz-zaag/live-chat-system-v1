import { Injectable, OnModuleInit } from '@nestjs/common';
import { CustomLoggerService } from '../logging/logger.service';
import * as process from 'node:process';

@Injectable()
export class InitialSeeder implements OnModuleInit {
  constructor(private readonly logger: CustomLoggerService) {}

  async onModuleInit() {
    this.logger.log('Starting initial seeding...');
    try {
      this.logger.log('Initial seeding completed.');
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }
}
