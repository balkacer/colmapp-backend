import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) {}

  @Post('register')
  register(@Body() dto: any) {
    return this.authClient.send({ cmd: 'register' }, dto);
  }

  @Post('login')
  login(@Body() dto: any) {
    return this.authClient.send({ cmd: 'login' }, dto);
  }
}