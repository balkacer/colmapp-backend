import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProviderDocument = Provider & Document;

@Schema({ timestamps: true })
export class Provider {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  description: string;

  @Prop({
    type: {
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
  })
  address?: Record<string, any>;

  @Prop()
  phone: string;

  @Prop()
  logoUrl: string;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);