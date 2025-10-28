import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from '@colmapp/interceptors';
import { RpcGlobalExceptionFilter } from '@colmapp/filters';

async function bootstrap() {
  console.log('Starting Payment Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmqUri') || ''],
        queue: configService.get<string>('rabbitmqPaymentQueue'),
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new RpcGlobalExceptionFilter());

  console.log('Payment Microservice is listening...');
  await app.listen();
}
bootstrap();