import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.create')
  create(@Payload() payload: CreateUserDto & { traceId: string; serviceSecret: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing creation for user: `, dto.email);
    return this.usersService.create(dto, traceId);
  }

  @MessagePattern('users.update')
  update(@Payload() payload: UpdateUserDto & { userId: string, traceId: string; serviceSecret: string }) {
    const { traceId, userId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing login for user: `, dto.email);
    return this.usersService.update(userId, dto, traceId);
  }

  @MessagePattern('users.getUserContact')
  getUserContact(@Payload() payload: { serviceSecret: string; userId: string, traceId: string }) {
    const { userId, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching contact info for userId: `, userId);
    return this.usersService.getUserContact(userId, traceId);
  }
}