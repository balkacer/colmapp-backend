import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  register(@Payload() payload: CreateUserDto & { traceId: string; serviceSecret: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing registration for user: `, dto.email);
    return this.authService.register(dto, traceId);
  }

  @MessagePattern('auth.login')
  login(@Payload() payload: LoginUserDto & { traceId: string; serviceSecret: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing login for user: `, dto.email);
    return this.authService.login(dto);
  }

  @MessagePattern('auth.getUserContact')
  getUserContact(@Payload() payload: { serviceSecret: string; userId: string, traceId: string }) {
    const { userId, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching contact info for userId: `, userId);
    return this.authService.getUserContact(userId);
  }
}