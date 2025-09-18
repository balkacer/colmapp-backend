import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, retry, timeout } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) { }

  @Post('register')
  register(@Body() dto: any) {
    return lastValueFrom(this.authClient.send({ cmd: 'register' }, dto).pipe(
      timeout(10000),
      retry(3),
    ));
  }

  @Post('login')
  login(@Body() dto: any) {
    return lastValueFrom(this.authClient.send({ cmd: 'login' }, dto).pipe(
      timeout(10000),
      retry(3),
    ));
  }
}