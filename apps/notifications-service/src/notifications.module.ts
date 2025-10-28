import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmlService, PshService, SmsService, WhtService } from './services';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }), ClientsModule.registerAsync([
      {
        name: 'USERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI') || ''],
            queue: configService.get<string>('RABBITMQ_USERS_QUEUE'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
    ])
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmlService,
    SmsService,
    PshService,
    WhtService
  ],
})
export class NotificationsModule { }
