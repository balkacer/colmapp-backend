import { IsUUID, IsInt, IsPositive, IsNumber } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  price: number;
}