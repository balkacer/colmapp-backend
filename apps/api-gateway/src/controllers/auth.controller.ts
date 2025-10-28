import { Controller, Post, Body, Inject, Req, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) { }

  @Post('register')
  async register(@Body() dto: any, @Req() req: any) {
    try {
      const traceId = req.headers['x-trace-id'] || randomUUID();
      return firstValueFrom(this.authClient.send('auth.register', {
        ...dto,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET,
      }).pipe(
        timeout(8000),
        retry(1),
      ));
    } catch (err) {
      throw new HttpException(
        err?.message || 'Error desconocido',
        err?.statusCode || 500
      );
    }
  }

  @Post('login')
  async login(@Body() dto: any, @Req() req: any) {
    try {
      const traceId = req.headers['x-trace-id'] || randomUUID();
      return firstValueFrom(this.authClient.send('auth.login', {
        ...dto,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET,
      }).pipe(
        timeout(8000),
        retry(1),
      ));
    } catch (err) {
      throw new HttpException(
        err?.message || 'Error desconocido',
        err?.statusCode || 500,
      );
    }
  }
}