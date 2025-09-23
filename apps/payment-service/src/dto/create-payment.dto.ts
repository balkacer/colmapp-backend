import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  reference?: string;
}