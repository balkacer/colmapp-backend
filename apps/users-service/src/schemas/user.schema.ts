import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ enum: ['CASHIER', 'OWNER', 'ADMIN'], default: 'CASHIER' })
  role!: string;

  @Prop()
  pushToken?: string;
  
  @Prop()
  phone?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ required: true })
  businessId!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);