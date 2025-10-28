import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';
import { LoggingInterceptor } from '@colmapp/interceptors';
import { RpcGlobalExceptionFilter } from '@colmapp/filters';

async function bootstrap() {
  console.log('Starting Notifications Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBITMQ_URI') || ''],
        queue: configService.get<string>('RABBITMQ_NOTIFICATIONS_QUEUE'),
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new RpcGlobalExceptionFilter());

  console.log('Notifications Microservice is listening...');
  await app.listen();
}
bootstrap();