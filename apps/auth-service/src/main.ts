import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { LoggingInterceptor } from '@colmapp/interceptors';

async function bootstrap() {
  console.log('Starting Auth Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBITMQ_URI') || ''],
        queue: configService.get<string>('RABBITMQ_AUTH_QUEUE'),
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  console.log('Auth Microservice is listening...');
  await app.listen();
}
bootstrap();