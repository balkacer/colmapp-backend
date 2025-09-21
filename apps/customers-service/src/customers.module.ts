import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, validationSchema } from '@colmapp/config';

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
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }])
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule { }