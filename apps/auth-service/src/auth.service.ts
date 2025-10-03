import { Inject, Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { CustomException } from '@colmapp/exceptions';
import { ResposeCodes } from '@colmapp/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
  ) { }

  // Registro de usuario
  async register(createUserDto: CreateUserDto, traceId: string): Promise<{ token: string }> {
    const { name, email, password, role, phone, pushToken } = createUserDto;

    const existing = await this.userModel.findOne({ email });

    if (existing) {
      throw new CustomException({
        statusCode: 400,
        message: 'User already exists',
        code: ResposeCodes.USER_ALREADY_EXISTS,
        traceId,
        meta: { email }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      name,
      email,
      password: hashedPassword,
      role: role ?? 'client',
      phone: phone ?? null,
      pushToken: pushToken ?? null,
      isActive: true,
    });

    this.notificationsClient.emit('notifications.welcomeUser', {
      userId: user._id,
      userName: user.name,
      traceId,
      serviceSecret: process.env.SERVICE_SECRET
    });

    await user.save();

    const payload = { sub: user._id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  // Login de usuario
  async login(loginUserDto: LoginUserDto, traceId: string): Promise<{ token: string }> {
    const { email, password } = loginUserDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new CustomException({
        statusCode: 401,
        message: 'Invalid credentials',
        code: ResposeCodes.INVALID_CREDENTIALS,
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
        message: 'User is inactive',
        code: ResposeCodes.UNAUTHORIZED,
        traceId,
        meta: { email }
      });
    }

    const payload = { sub: user._id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  // Obtener información de contacto del usuario
  async getUserContact(userId: string, traceId: string): Promise<{ email: string; phone?: string, pushToken?: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId }
      });
    }
    return { email: user.email, phone: user.phone, pushToken: user.pushToken };
  }
}