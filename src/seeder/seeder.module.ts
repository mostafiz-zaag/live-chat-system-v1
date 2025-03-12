// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { InitialSeeder } from './initial.seeder';
import { CustomLoggerService } from '../logging/logger.service';

@Module({
  imports: [], // Registers the User entity
  providers: [InitialSeeder, CustomLoggerService], // Registers the services and repository
  controllers: [], // Registers the controller
  exports: [InitialSeeder], // Exports the services if needed elsewhere
})
export class SeederModule {}
