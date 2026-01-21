import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['CASHIER', 'OWNER', 'ADMIN'])
  @IsOptional()
  role?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?:string;

  @IsString()
  @IsOptional()
  pushToken?: string;

  @IsOptional()
  isActive?: boolean;
}