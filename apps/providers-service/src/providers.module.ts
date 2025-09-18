import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { Provider, ProviderSchema } from './schemas/provider.schema';
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
    MongooseModule.forFeature([{ name: Provider.name, schema: ProviderSchema }])
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
})
export class ProvidersModule { }