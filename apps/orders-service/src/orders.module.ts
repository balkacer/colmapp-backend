import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { configuration, validationSchema } from '@colmapp/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('mongoUri'),
        dbName: config.get<string>('mongoDbName')
      }),
    }),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ClientsModule.registerAsync([
      {
        name: 'CUSTOMERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmqUri') || ''],
            queue: configService.get<string>('rabbitmqCustomersQueue'),
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
            urls: [configService.get<string>('rabbitmqUri') || ''],
            queue: configService.get<string>('rabbitmqProvidersQueue'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
      {
        name: 'PAYMENT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmqUri') || ''],
            queue: configService.get<string>('rabbitmqPaymentQueue'),
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
            urls: [configService.get<string>('rabbitmqUri') || ''],
            queue: configService.get<string>('rabbitmqProductsQueue'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmqUri') || ''],
            queue: configService.get<string>('rabbitmqNotificationsQueue'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      },
    ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule { }
