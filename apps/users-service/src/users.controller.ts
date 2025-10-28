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

  @MessagePattern('users.findAll')
  findAll(@Payload() payload: { serviceSecret: string; traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all users`);
    return this.usersService.findAll(traceId);
  }

  @MessagePattern('users.findOne')
  findOne(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching user with ID: `, id);
    return this.usersService.findOne(id, traceId);
  }

  @MessagePattern('users.findByEmail')
  findByEmail(@Payload() payload: { serviceSecret: string; email: string, traceId: string }) {
    const { email, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching user with email: `, email);
    return this.usersService.findByEmail(email, traceId);
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

  @MessagePattern('users.remove')
  remove(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing user with ID: `, id);
    return this.usersService.remove(id, traceId);
  }

  @MessagePattern('users.activate')
  activate(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Activating user with ID: `, id);
    return this.usersService.activateUser(id, traceId);
  }

  @MessagePattern('users.deactivate')
  deactivate(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Deactivating user with ID: `, id);
    return this.usersService.deactivateUser(id, traceId);
  }

  @MessagePattern('users.changePassword')
  changePassword(@Payload() payload: { serviceSecret: string; userId: string; currentPassword: string; newPassword: string; traceId: string }) {
    const { userId, currentPassword, newPassword, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Changing password for userId: `, userId);
    return this.usersService.changePassword(userId, currentPassword, newPassword, traceId);
  }
}