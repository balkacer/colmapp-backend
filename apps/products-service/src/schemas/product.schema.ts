import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  stock: number;

  @Prop({ required: true })
  providerId: string; // relación con ProvidersService

  @Prop()
  shopifyProductId?: string; // futuro: sincronización Shopify
}

export const ProductSchema = SchemaFactory.createForClass(Product);