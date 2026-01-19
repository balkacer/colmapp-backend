import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';
import { validatePassword } from '@colmapp/utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
  ) { }

  async create(createUserDto: CreateUserDto, traceId: string) {
    const { name, email, password, role, phone, pushToken } = createUserDto;

    if (!email || email.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Email is required',
        code: ResponseCodes.REQUIDED_FIELD_MISSING,
        traceId,
        meta: { email }
      });
    }
    if (!name || name.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Name is required',
        code: ResponseCodes.REQUIDED_FIELD_MISSING,
        traceId,
        meta: { name }
      });
    }
    if (!password || password.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Password is required',
        code: ResponseCodes.REQUIDED_FIELD_MISSING,
        traceId,
        meta: {}
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid email format',
        code: ResponseCodes.INVALID_EMAIL,
        traceId,
        meta: { email }
      });
    }

    if (password.length < 8) {
      throw new CustomException({
        statusCode: 400,
        message: 'Password must be at least 8 characters long',
        code: ResponseCodes.WEAK_PASSWORD,
        traceId,
        meta: {}
      });
    }

    const isWeak = !validatePassword(password);

    if (isWeak) {
      throw new CustomException({
        statusCode: 400,
        message: 'Password must include uppercase, lowercase, number, and special character',
        code: ResponseCodes.WEAK_PASSWORD,
        traceId,
        meta: {}
      });
    }

    const existing = await this.findByEmail(email);

    if (existing) {
      if (existing.isActive) {
        throw new CustomException({
          statusCode: 400,
          message: 'User already exists',
          code: ResponseCodes.USER_ALREADY_EXISTS,
          traceId,
          meta: { email }
        });
      } else {
        // TODO: Reactivate user flow
        throw new CustomException({
          statusCode: 400,
          message: 'User is deactivated',
          code: ResponseCodes.USER_DEACTIVATED,
          traceId,
          meta: { email }
        });
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

    try {
      return await user.save();
    } catch (err) {
      if (err.code === 11000) {
        throw new CustomException({
          statusCode: 400,
          message: 'User already exists',
          code: ResponseCodes.USER_ALREADY_EXISTS,
          traceId,
          meta: { email },
        });
      }
      throw err;
    }
  }

  async findAll(traceId?: string) {
    return this.userModel.find().exec();
  }

  async findOne(id: string, traceId?: string) {
    return this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto, traceId: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResponseCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }

    for (const [key, value] of Object.entries(updateUserDto)) {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        throw new CustomException({
          statusCode: 400,
          message: `Field '${key}' cannot be empty`,
          code: ResponseCodes.REQUIDED_FIELD_MISSING,
          traceId,
          meta: { field: key }
        });
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new CustomException({
          statusCode: 400,
          message: 'Email already in use',
          code: ResponseCodes.EMAIL_ALREADY_IN_USE,
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
        code: ResponseCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }
    return { message: 'User deleted successfully' }
  }

  async findByEmail(email: string, traceId?: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async changePassword(id: string, password: string, newPassword: string, traceId: string): Promise<void> {
    if (!password || password.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Current password is required',
        code: ResponseCodes.REQUIDED_FIELD_MISSING,
        traceId,
        meta: {}
      });
    }
    if (!newPassword || newPassword.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'New password is required',
        code: ResponseCodes.REQUIDED_FIELD_MISSING,
        traceId,
        meta: {}
      });
    }
    if (newPassword.length < 8) {
      throw new CustomException({
        statusCode: 400,
        message: 'New password must be at least 8 characters long',
        code: ResponseCodes.WEAK_PASSWORD,
        traceId,
        meta: {}
      });
    }

    const isWeak = !validatePassword(newPassword);

    if (isWeak) {
      throw new CustomException({
        statusCode: 400,
        message: 'New password must include uppercase, lowercase, number, and special character',
        code: ResponseCodes.WEAK_PASSWORD,
        traceId,
        meta: {}
      });
    }

    const user = await this.findOne(id);
    if (!user) {
      throw new CustomException({
        statusCode: 404,
        message: 'User not found',
        code: ResponseCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomException({
        statusCode: 401,
        message: 'Invalid credentials',
        code: ResponseCodes.INVALID_CREDENTIALS,
        traceId,
        meta: { userId: id }
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new CustomException({
        statusCode: 400,
        message: 'New password must be different from the current password',
        code: ResponseCodes.PASSWORD_RESET_FAILED,
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
        code: ResponseCodes.USER_NOT_FOUND,
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
        code: ResponseCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }
    if (user.isActive === false) {
      throw new CustomException({
        statusCode: 400,
        message: 'User is already deactivated',
        code: ResponseCodes.USER_DEACTIVATED,
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
        code: ResponseCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId: id }
      });
    }
    if (user.isActive === true) {
      throw new CustomException({
        statusCode: 400,
        message: 'User is already active',
        code: ResponseCodes.USER_ALREADY_ACTIVATED,
        traceId,
        meta: { userId: id }
      });
    }
    user.isActive = true;
    await user.save();
  }
}