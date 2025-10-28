import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { CustomException } from '@colmapp/exceptions';
import { ResposeCodes } from '@colmapp/types';
import { firstValueFrom, retry, timeout } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) { }

  async register(createUserDto: CreateUserDto, traceId: string): Promise<{ token: string }> {
    const { name, email, password, role, phone, pushToken } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await firstValueFrom(
      this.usersClient.send('users.create', {
        name,
        email,
        password: hashedPassword,
        role: role ?? 'client',
        phone: phone ?? null,
        pushToken: pushToken ?? null,
        isActive: true,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1))
    );

    this.notificationsClient.emit('notifications.welcomeUser', {
      userId: user._id,
      userName: user.name,
      traceId,
      serviceSecret: process.env.SERVICE_SECRET
    });

    const token = this.jwtService.sign({ sub: user._id, role: user.role });
    return { token };
  }

  async login(loginUserDto: LoginUserDto, traceId: string): Promise<{ token: string }> {
    const { email, password } = loginUserDto;

    if (!email || !password) {
      throw new CustomException({
        statusCode: 400,
        message: 'Email and password are required',
        code: ResposeCodes.INVALID_INPUT,
        traceId,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid email format',
        code: ResposeCodes.INVALID_EMAIL,
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
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { email }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomException({
        statusCode: 401,
        message: 'Invalid credentials',
        code: ResposeCodes.INVALID_CREDENTIALS,
        traceId,
        meta: { email }
      });
    }

    if (!user.isActive) {
      throw new CustomException({
        statusCode: 403,
        message: 'User is inactive. Please contact support to reactivate your account.',
        code: ResposeCodes.USER_INACTIVE,
        traceId,
        meta: { email }
      });
    }

    const payload = { sub: user._id, role: user.role };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  validateRole(userRole: string, allowedRoles: string[], traceId: string) {
    if (!allowedRoles.includes(userRole)) {
      throw new CustomException({
        statusCode: 403,
        message: 'Access denied: insufficient permissions',
        code: ResposeCodes.UNAUTHORIZED,
        traceId,
      });
    }
  }
}