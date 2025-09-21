import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class Address {
  @IsString()
  @IsOptional()
  alias?: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsOptional()
  @Type(() => Object)
  coordinates?: {
    lat: number;
    lng: number;
  };
}
  

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Type(() => Address)
  addresses?: Address[];
}