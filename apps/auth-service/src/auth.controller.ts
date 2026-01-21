import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.login')
  login(@Payload() payload: LoginUserDto & { traceId: string; serviceSecret: string; ip: string }) {
    const { traceId, ip, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing login for user: `, dto.email);
    return this.authService.login(dto, ip, traceId);
  }
}