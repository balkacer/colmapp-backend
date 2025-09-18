import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  register(data: CreateUserDto) {
    return this.authService.register(data);
  }

  @MessagePattern({ cmd: 'login' })
  login(data: LoginUserDto) {
    return this.authService.login(data);
  }
}