import { NestFactory } from '@nestjs/core';
import { envConfig } from './constants/env.constant';
import { configureWebSettings } from './configs/web.config';
import { CustomLoggerService } from './logging/logger.service';
import { AppModule } from './app.module';
import { faviconMiddleware } from './middlewares/favicon.middleware';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerConfig } from './configs/swagger.config';
import { createDatabaseIfNotExists, setInitialSequenceValues } from './configs/database.config';

async function bootstrap() {
  // Create the database if it doesn't exist
  await createDatabaseIfNotExists();

  const app = await NestFactory.create(AppModule);

  // Call the web configuration method here
  configureWebSettings(app); // Ensure this is called with the base instance

  // swagger config
  SwaggerConfig.setup(app);

  const customLogger = app.get(CustomLoggerService);
  app.useLogger(customLogger); // Register custom logger
  app.use(faviconMiddleware); // Apply favicon middleware

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically remove properties that are not part of the DTO
      forbidNonWhitelisted: false, // Throw an error if non-whitelisted properties are provided
      transform: true, // Automatically transform payloads into DTO instances
    }),
  );

  // Log application start
  customLogger.log('Application is starting...');

  // Log unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    customLogger.error(reason);
  });

  // Log uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    customLogger.error(error);
    process.exit(1);
  });

  await setInitialSequenceValues();

  await app.listen(envConfig.SERVER_PORT);
  customLogger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
