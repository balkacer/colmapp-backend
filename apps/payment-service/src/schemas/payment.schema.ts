import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Schema({ collection: 'payments', timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  method: string; // card & cash

  @Prop()
  reference?: string;
  // - card → últimos 4 dígitos: "****4242"
  // - cash → número de recibo: "CASH-20250922-001"

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);