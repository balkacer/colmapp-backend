import { NestFactory } from '@nestjs/core';
import { CustomersModule } from './customers.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';
import { LoggingInterceptor } from '@colmapp/interceptors';
import { RpcGlobalExceptionFilter } from '@colmapp/filters';

async function bootstrap() {
  console.log('Starting Customers Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CustomersModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmqUri') || ''],
        queue: configService.get<string>('rabbitmqCustomersQueue'),
        queueOptions: { durable: false },
      },
    },
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new RpcGlobalExceptionFilter());

  console.log('Customers Microservice is listening...');
  await app.listen();
}
bootstrap();