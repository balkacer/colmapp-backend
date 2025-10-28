import { PaymentMethod } from '@colmapp/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PaymentStatus } from '../types/paymentStatus.enum';

export type PaymentDocument = Payment & Document;

@Schema({ collection: 'payments', timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  customerId: string;

  @Prop({ required: true })
  providerId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, length: 3 })
  currency: string;

  @Prop({ required: true, enum: PaymentMethod, type: String })
  method: PaymentMethod;

  @Prop()
  reference?: string;
  // - card → últimos 4 dígitos: "****4242"
  // - cash → número de recibo: "CASH-20250922-001"

  @Prop()
  externalReference?: string;

  @Prop()
  externalStatus?: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING, type: String })
  status: PaymentStatus;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);