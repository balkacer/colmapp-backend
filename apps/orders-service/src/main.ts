import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from '@colmapp/interceptors';

async function bootstrap() {
  console.log('Starting Orders Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmqUri') || ''],
        queue: configService.get<string>('rabbitmqOrdersQueue'),
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  console.log('Orders Microservice is listening...');
  await app.listen();
}
bootstrap();