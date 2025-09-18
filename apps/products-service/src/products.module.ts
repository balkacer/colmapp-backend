import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.schema';
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
      MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}