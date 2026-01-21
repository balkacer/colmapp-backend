import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BusinessDocument = Business & Document;

@Schema({ collection: 'businesses', timestamps: true })
export class Business {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email!: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);