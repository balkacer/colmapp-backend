import { NestFactory } from '@nestjs/core';
import { FilesModule } from './files.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';

async function bootstrap() {
  console.log('Starting Files Microservice...');
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  );
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    FilesModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBITMQ_URI') || ''],
        queue: configService.get<string>('RABBITMQ_FILES_QUEUE'),
        queueOptions: { durable: false },
      },
    },
  );

  console.log('Files Microservice is listening...');
  await app.listen();
}
bootstrap();