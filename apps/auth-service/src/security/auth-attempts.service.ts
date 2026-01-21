import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import Redis from 'ioredis';
import { CustomException } from 'libs/exceptions/custom.exception';
import { ResponseCodes } from 'libs/types/responseCodes';

interface AttemptInfo {
  count: number;
  lockedUntil?: number;
}

@Injectable()
export class AuthAttemptsService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) { }

  private getKey(email: string, ip: string) {
    return `auth:attempts:${email}:${ip}`;
  }

  async canAttempt(email: string, ip: string, traceId: string): Promise<void> {
    const key = this.getKey(email, ip);
    const raw = await this.redis.get(key);

    if (!raw) return;

    const data: AttemptInfo = JSON.parse(raw);

    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      throw new CustomException({
        statusCode: 400,
        message: 'Too many attempts. Try again later.',
        code: ResponseCodes.INVALID_INPUT,
        traceId,
      });
    }
  }

  async registerFailure(email: string, ip: string): Promise<void> {
    const key = this.getKey(email, ip);
    const raw = await this.redis.get(key);

    const data: AttemptInfo = raw
      ? JSON.parse(raw)
      : { count: 0 };

    data.count++;

    if (data.count === 5) {
      data.lockedUntil = Date.now() + 10 * 60 * 1000;
    }

    if (data.count >= 10) {
      data.lockedUntil = Date.now() + 60 * 60 * 1000;
    }

    await this.redis.set(
      key,
      JSON.stringify(data),
      'EX',
      60 * 60 * 2, // TTL 2 horas
    );
  }

  async reset(email: string, ip: string): Promise<void> {
    await this.redis.del(this.getKey(email, ip));
  }
}