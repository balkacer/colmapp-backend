import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @IsEnum(['CASHIER', 'OWNER','ADMIN'])
  @IsOptional()
  role?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsMongoId()
  @IsNotEmpty()
  businessId!: string;
}