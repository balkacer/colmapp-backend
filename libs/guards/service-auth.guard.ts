import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = context.switchToRpc();
    const data = ctx.getData();

    if (!data || data.serviceSecret !== process.env.SERVICE_SECRET) {
      throw new RpcException(new UnauthorizedException('Invalid service secret'));
    }

    return true;
  }
}