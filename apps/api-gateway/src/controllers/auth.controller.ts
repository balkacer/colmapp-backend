import { Controller, Post, Body, Inject, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, retry, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) { }

  @Post('register')
  async register(@Body() dto: any, @Req() req: any) {
    const traceId = req.headers['x-trace-id'] || randomUUID();
    return lastValueFrom(this.authClient.send('auth.register', { ...dto, traceId }).pipe(
      timeout(10000),
      retry(3),
    ));
  }

  @Post('login')
  async login(@Body() dto: any, @Req() req: any) {
    const traceId = req.headers['x-trace-id'] || randomUUID();
    return lastValueFrom(this.authClient.send('auth.login', { ...dto, traceId }).pipe(
      timeout(10000),
      retry(3),
    ));
  }
}