import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AuthController,
  NotificationsController,
  OrdersController,
  PaymentController,
  ProductsController,
  ProvidersController
} from '../controllers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI') || ''],
            queue: configService.get<string>('RABBITMQ_AUTH_QUEUE'),
            queueOptions: { durable: false },
          },
        }),
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    NotificationsController,
    OrdersController,
    PaymentController,
    ProductsController,
    ProvidersController
  ],
  providers: [AppService],
})
export class AppModule { }