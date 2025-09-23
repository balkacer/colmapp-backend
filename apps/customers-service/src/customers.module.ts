import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';
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
    ClientsModule.registerAsync([
      {
        name: 'ORDERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('rabbitmqUri') || ''],
            queue: configService.get<string>('rabbitmqOrdersQueue'),
            queueOptions: { durable: false },
            retryAttempts: 5,
            retryDelay: 5000,
          },
        }),
      }
    ]),
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }])
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule { }