import { NestFactory } from '@nestjs/core';
import { ProvidersModule } from './providers.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log('Starting Providers Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProvidersModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmqUri') || ''],
        queue: configService.get<string>('rabbitmqProvidersQueue'),
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  console.log('Providers Microservice is listening...');
  await app.listen();
}
bootstrap();