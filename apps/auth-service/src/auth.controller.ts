import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  register(@Payload() payload: CreateUserDto & { traceId: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing registration for user: `, dto.email);
    return this.authService.register(payload);
  }

  @MessagePattern('auth.login')
  login(@Payload() payload: LoginUserDto & { traceId: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing login for user: `, dto.email);
    return this.authService.login(payload);
  }
}