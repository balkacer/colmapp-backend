import { IsUUID, IsInt, IsPositive, IsNumber } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  price: number; // precio actual del producto (traído del products-service)
}