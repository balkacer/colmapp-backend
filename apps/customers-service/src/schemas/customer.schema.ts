import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ collection: 'customers', timestamps: true })
export class Customer {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({
    type: [
      {
        alias: String,
        street: String,
        city: String,
        country: String,
        zip: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
    ],
  })
  addresses: Record<string, any>[];
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);