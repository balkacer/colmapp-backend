import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsString()
  @IsOptional()
  shopifyProductId?: string;
}