import { NestFactory } from '@nestjs/core';
import { BusinessModule } from './business.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { LoggingInterceptor } from '@colmapp/interceptors';
import { RpcGlobalExceptionFilter } from '@colmapp/filters';

async function bootstrap() {
  console.log('Starting Business Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BusinessModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBITMQ_URI') || ''],
        queue: configService.get<string>('RABBITMQ_BUSINESS_QUEUE'),
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new RpcGlobalExceptionFilter());

  console.log('Business Microservice is listening...');
  await app.listen();
}
bootstrap();