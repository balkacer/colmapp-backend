import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AuthController,
  CustomersController,
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
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
      {
        name: 'PRODUCTS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI') || ''],
            queue: configService.get<string>('RABBITMQ_PRODUCTS_QUEUE'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
      {
        name: 'FILES_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI') || ''],
            queue: configService.get<string>('RABBITMQ_FILES_QUEUE'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
      {
        name: 'PROVIDERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI') || ''],
            queue: configService.get<string>('RABBITMQ_PROVIDERS_QUEUE'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
      {
        name: 'ORDERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI') || ''],
            queue: configService.get<string>('RABBITMQ_ORDERS_QUEUE'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
      {
        name: 'CUSTOMERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI') || ''],
            queue: configService.get<string>('RABBITMQ_CUSTOMERS_QUEUE'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
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
    ProvidersController,
    CustomersController,
  ],
  providers: [AppService],
})
export class AppModule { }