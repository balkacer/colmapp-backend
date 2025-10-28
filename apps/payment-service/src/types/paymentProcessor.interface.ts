import { CreatePaymentDto } from "../dto/create-payment.dto";
import { IPaymentResult } from "./paymentResult.interface";

export interface IPaymentProcessor {
  create(payload: CreatePaymentDto, traceId?: string, meta?: Record<string, any>): Promise<IPaymentResult>;
  get(paymentId: string, traceId?: string): Promise<IPaymentResult>;
  capture?(paymentId: string, traceId?: string): Promise<IPaymentResult>;
  refund?(paymentId: string, amount?: number, traceId?: string): Promise<IPaymentResult>;
}