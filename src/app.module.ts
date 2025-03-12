import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { CustomGlobalExceptionFilter } from 'src/exceptions/global.exception';
import { LoggerMiddleware } from 'src/logging/logger.middleware';
import { BaseController } from './modules/base/base.controller';
import { BaseService } from './modules/base/base.service';
import { SeederModule } from './seeder/seeder.module';
import { CommonModule } from './common/modules/common.module';
import { RequestMiddleware } from './middlewares/request.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { STATIC } from './constants/global.constant';
import { StaticFileCheckMiddleware } from './middlewares/static-file-check.middleware';
import { AgentModule } from './modules/agents/agent.module';
import { ChatModule } from './modules/chat/chat.module';
import { UserModule } from './modules/user/user.module';
import { ChatGateway } from './modules/chat/chat.gateway';
import { NatsModule } from './modules/nats/nats.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './configs/database.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Makes ConfigModule available globally
        }),
        TypeOrmModule.forRoot(databaseConfig),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', `${STATIC}`), // Serve static files from the 'static' folder
            serveRoot: `/${STATIC}`, // Serve files at '/static/filename' URL
        }),
        ScheduleModule.forRoot(),
        CommonModule,
        SeederModule,
        AgentModule,
        ChatModule,
        UserModule,
        NatsModule,
        EventEmitterModule.forRoot(),
    ],
    controllers: [BaseController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: CustomGlobalExceptionFilter,
        },
        BaseService,
        ChatGateway,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestMiddleware)
            .forRoutes('*')
            .apply(LoggerMiddleware) // Apply LoggerMiddleware globally
            .forRoutes('*')
            // .apply(JwtMiddleware) // Apply JwtMiddleware to routes containing "secured"
            // .forRoutes('*secured*')
            .apply(StaticFileCheckMiddleware)
            .forRoutes('/static/*'); // Apply to all static file routes;
    }
}
