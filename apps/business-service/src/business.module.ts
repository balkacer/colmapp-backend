import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { validationSchema, configuration } from '@colmapp/config';

import { Business, BusinessSchema } from './schemas/business.schema';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';

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
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }])
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule { }