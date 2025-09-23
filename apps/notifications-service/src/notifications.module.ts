import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmlService, PshService, SmsService, WhtService } from './services';
import { configuration, validationSchema } from '@colmapp/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }), ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmqUri') || ''],
            queue: configService.get<string>('rabbitmqAuthQueue'),
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
