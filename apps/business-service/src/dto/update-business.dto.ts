import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessDto } from './create-business.dto';
import { IsOptional } from 'class-validator';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @IsOptional()
  isActive?: boolean;
}