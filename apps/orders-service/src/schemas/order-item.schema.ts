import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderItemDocument = OrderItem & Document;

@Schema()
export class OrderItem {
  @Prop({ type: String, required: true })
  productId: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  price: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);