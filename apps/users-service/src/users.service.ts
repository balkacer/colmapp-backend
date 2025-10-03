import { Inject, Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { CustomException } from '@colmapp/exceptions';
import { ResposeCodes } from '@colmapp/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
  ) { }

  async create(createUserDto: CreateUserDto, traceId: string): Promise<{ token: string }> {
    const { name, email, password, role, phone, pushToken } = createUserDto;

    const existing = await this.findByEmail(email);

    if (existing) {
      if (existing.isActive) {
        throw new CustomException({
          statusCode: 400,
          message: 'User already exists',
          code: ResposeCodes.USER_ALREADY_EXISTS,
          traceId,
          meta: { email }
        });
      } else {

      }
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

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto, traceId: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new CustomException({
          statusCode: 400,
          message: 'Email already in use',
          code: ResposeCodes.EMAIL_ALREADY_IN_USE,
          traceId,
          meta: { email: updateUserDto.email }
        });
      }
    }

    Object.assign(user, updateUserDto);
    return user.save();
  }

  async remove(id: string, traceId: string): Promise<{ message: string }> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }
    return { message: 'User deleted successfully' }
  }
  
  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async updatePassword(id: string, password: string, newPassword: string, traceId: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomException({
        statusCode: 401,
        message: 'Invalid credentials',
        code: ResposeCodes.INVALID_CREDENTIALS,
        traceId,
        meta: { userId: id }
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async getUserContact(id: string, traceId: string): Promise<{ email: string; phone?: string, pushToken?: string }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }
    return { email: user.email, phone: user.phone, pushToken: user.pushToken };
  }

  async deactivateUser(id: string, traceId: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }
    user.isActive = false;
    await user.save();
  }

  async activateUser(id: string, traceId: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }
    user.isActive = true;
    await user.save();
  }
}