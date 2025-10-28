import { PaymentMethod } from '@colmapp/types';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import type { Currency } from '../types/currency.type';

export class CreatePaymentDto {
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNotEmpty()
  currency: Currency;

  @IsOptional()
  @IsString()
  paymentMethodId?: string; 
}