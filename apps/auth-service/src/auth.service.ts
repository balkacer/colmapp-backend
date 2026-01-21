import { Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

import { LoginUserDto } from './dto/login-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { AuthAttemptsService } from './security/auth-attempts.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
    @Inject('BUSINESS_SERVICE') private readonly businessClient: ClientProxy,
    @Inject() private readonly authAttempts: AuthAttemptsService
  ) { }

  async login(loginUserDto: LoginUserDto, ip: string, traceId: string): Promise<{
    token: string,
    user: {
      id: string,
      email: string,
      name: string,
      role: string
    },
    business: {
      id: string,
      name: string
    }
  }> {
    const { email, password } = loginUserDto;
    try {
      await this.authAttempts.canAttempt(email, ip, traceId);
    } catch (error) {
      if (error instanceof CustomException) {
        this.authAttempts.registerFailure(email, ip);
      }
      throw error;
    }

    const pepper = process.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new CustomException({
        statusCode: 500,
        message: 'PASSWORD_PEPPER is not configured',
        code: ResponseCodes.INTERNAL_SERVER_ERROR,
        traceId,
      });
    }

    if (!email || !password) {
      this.authAttempts.registerFailure(email, ip);
      throw new CustomException({
        statusCode: 400,
        message: 'Email and password are required',
        code: ResponseCodes.INVALID_INPUT,
        traceId,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid email format',
        code: ResponseCodes.INVALID_EMAIL,
        traceId,
        meta: { email },
      });
    }

    const user = await firstValueFrom(
      this.usersClient.send('users.findByEmail', {
        email,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1))
    );

    if (!user) {
      this.authAttempts.registerFailure(email, ip);
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResponseCodes.USER_NOT_FOUND,
        traceId,
        meta: { email }
      });
    }

    const isPasswordValid = await argon2.verify(user.password, password + pepper);
    if (!isPasswordValid) {
      this.authAttempts.registerFailure(email, ip);
      throw new CustomException({
        statusCode: 401,
        message: 'Invalid credentials',
        code: ResponseCodes.INVALID_CREDENTIALS,
        traceId,
        meta: { email }
      });
    }

    if (!user.isActive) {
      this.authAttempts.registerFailure(email, ip);
      throw new CustomException({
        statusCode: 403,
        message: 'User is inactive. Please contact support to reactivate your account.',
        code: ResponseCodes.USER_INACTIVE,
        traceId,
        meta: { email }
      });
    }

    const business = await firstValueFrom(
      this.businessClient.send('business.findOne', {
        id: user.businessId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1))
    );

    if (!business) {
      throw new CustomException({
        statusCode: 404,
        message: 'Business not found',
        code: ResponseCodes.BUSINESS_NOT_FOUND,
        traceId,
        meta: { businessId: user.businessId }
      });
    }

    if (!business.isActive) {
      throw new CustomException({
        statusCode: 403,
        message: 'Business is inactive. Please contact support to reactivate your account.',
        code: ResponseCodes.BUSINESS_INACTIVE,
        traceId,
        meta: { businessId: user.businessId }
      });
    }

    this.authAttempts.reset(email, ip);

    const token = await this.buildSession(user, business);

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      business: {
        id: business._id,
        name: business.name
      }
    }
  }

  async buildSession(user: any, business: any): Promise<string> {
    const payload = { id: user._id, businessId: business._id, role: user.role };
    return this.jwtService.signAsync(payload);
  }
}