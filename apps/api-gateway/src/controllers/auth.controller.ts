import { Controller, Post, Body, Inject, Req, HttpException, Get } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom, retry, timeout } from 'rxjs';
import { randomUUID } from 'crypto';
import { Public } from 'libs/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    @Inject('USERS_SERVICE') private userClient: ClientProxy
  ) { }

  @Public()
  @Post('login')
  async login(@Body() dto: any, @Req() req: any) {
    try {
      const traceId = req.headers['x-trace-id'] || randomUUID();
      return firstValueFrom(this.authClient.send('auth.login', {
        ...dto,
        ip: req.ip,
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

  @Get('me')
  async getMe(@Req() req: any): Promise<void> {
    try {
      const traceId = req.headers['x-trace-id'] || randomUUID();
      return lastValueFrom(this.userClient.send('users.findOne', {
        id: req.user.id,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
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