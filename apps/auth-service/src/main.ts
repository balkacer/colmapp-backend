import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';

async function bootstrap() {
  console.log('Starting Auth Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmqUri') || ''],
        queue: configService.get<string>('rabbitmqAuthQueue'),
        queueOptions: { durable: false },
      },
    },
  );

  console.log('Auth Microservice is listening...');
  await app.listen();
}
bootstrap();