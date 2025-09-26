import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
  ) { }

  // Registro de usuario
  async register(createUserDto: CreateUserDto, traceId?: string): Promise<{ token: string }> {
    const { name, email, password, role, phone, pushToken } = createUserDto;

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new UnauthorizedException('User already exists');
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

    this.notificationsClient.emit('notifications.welcomeUser', { userId: user._id, userName: user.name, traceId, serviceSecret: process.env.SERVICE_SECRET })
    
    await user.save();

    const payload = { sub: user._id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  // Login de usuario
  async login(loginUserDto: LoginUserDto): Promise<{ token: string }> {
    const { email, password } = loginUserDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    const payload = { sub: user._id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  // Obtener información de contacto del usuario
  async getUserContact(userId: string): Promise<{ email: string; phone?: string, pushToken?: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new UnauthorizedException('User not found');
    return { email: user.email, phone: user.phone, pushToken: user.pushToken };
  }
}