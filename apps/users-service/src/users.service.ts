import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';
import { validatePassword } from '@colmapp/utils';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('BUSINESS_SERVICE') private readonly businessClient: ClientProxy
  ) { }

  async create(createUserDto: CreateUserDto, traceId: string) {
    const { name, email, password, role, phone, businessId } = createUserDto;

    if (!businessId || businessId.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Business ID is required',
        code: ResponseCodes.REQUIRED_FIELD_MISSING,
        traceId,
        meta: { businessId }
      });
    }
    if (!email || email.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Email is required',
        code: ResponseCodes.REQUIRED_FIELD_MISSING,
        traceId,
        meta: { email }
      });
    }
    if (!name || name.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Name is required',
        code: ResponseCodes.REQUIRED_FIELD_MISSING,
        traceId,
        meta: { name }
      });
    }
    if (!password || password.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Password is required',
        code: ResponseCodes.REQUIRED_FIELD_MISSING,
        traceId,
        meta: {}
      });
    }

    const business = await firstValueFrom(
      this.businessClient.send('business.findOne', {
        id: businessId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(
        timeout(8000), retry(1)
      )
    );

    if (!business) {
      throw new CustomException({
        statusCode: 404,
        message: 'Business not found',
        code: ResponseCodes.BUSINESS_NOT_FOUND,
        traceId,
        meta: { businessId }
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

    const pepper = process.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new Error('PASSWORD_PEPPER is not configured');
    }

    const hashedPassword = await argon2.hash(password + pepper);

    const user = new this.userModel({
      name,
      email,
      password: hashedPassword,
      role: role ?? 'CASHIER',
      phone: phone ?? null,
      businessId,
      isActive: true,
    });

    try {
      const result = await user.save();
      delete (result as any).password;
      return result;
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
          code: ResponseCodes.REQUIRED_FIELD_MISSING,
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
    const result = await user.save();
    delete (result as any).password;
    return result;
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
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async changePassword(id: string, password: string, newPassword: string, traceId: string): Promise<void> {
    if (!password || password.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Current password is required',
        code: ResponseCodes.REQUIRED_FIELD_MISSING,
        traceId,
        meta: {}
      });
    }
    if (!newPassword || newPassword.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'New password is required',
        code: ResponseCodes.REQUIRED_FIELD_MISSING,
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

    const pepper = process.env.PASSWORD_PEPPER;
    if (!pepper) {
      throw new Error('PASSWORD_PEPPER is not configured');
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

    const isPasswordValid = await argon2.verify(user.password, password + pepper);
    if (!isPasswordValid) {
      throw new CustomException({
        statusCode: 401,
        message: 'Invalid credentials',
        code: ResponseCodes.INVALID_CREDENTIALS,
        traceId,
        meta: { userId: id }
      });
    }

    const isSamePassword = await argon2.verify(user.password, newPassword + pepper);
    if (isSamePassword) {
      throw new CustomException({
        statusCode: 400,
        message: 'New password must be different from the current password',
        code: ResponseCodes.PASSWORD_RESET_FAILED,
        traceId,
        meta: { userId: id }
      });
    }

    user.password = await argon2.hash(newPassword + pepper);
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