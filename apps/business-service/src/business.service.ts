import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Business, BusinessDocument } from './schemas/business.schema';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
  ) { }

  async create(createBusinessDto: CreateBusinessDto, traceId: string) {
    const { name, email, phone } = createBusinessDto;

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

    const business = new this.businessModel({
      name,
      email,
      phone: phone ?? null,
      isActive: true,
    });

    try {
      return await business.save();
    } catch (err) {
      if (err.code === 11000) {
        throw new CustomException({
          statusCode: 400,
          message: 'Business already exists',
          code: ResponseCodes.BUSINESS_ALREADY_EXISTS,
          traceId,
          meta: { email },
        });
      }
      throw err;
    }
  }

  async findAll(traceId?: string) {
    return this.businessModel.find().exec();
  }

  async findOne(id: string, traceId?: string) {
    return this.businessModel.findById(id).exec();
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto, traceId: string) {
    const business = await this.findOne(id);
    if (!business) {
      throw new CustomException({
        statusCode: 404,
        message: 'Business not found',
        code: ResponseCodes.BUSINESS_NOT_FOUND,
        traceId,
        meta: { businessId: id }
      });
    }

    for (const [key, value] of Object.entries(updateBusinessDto)) {
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

    Object.assign(business, updateBusinessDto);
    return business.save();
  }

  async remove(id: string, traceId: string): Promise<{ message: string }> {
    const result = await this.businessModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new CustomException({
        statusCode: 404,
        message: 'Business not found',
        code: ResponseCodes.BUSINESS_NOT_FOUND,
        traceId,
        meta: { businessId: id }
      });
    }
    return { message: 'User deleted successfully' }
  }

  async deactivateBusiness(id: string, traceId: string): Promise<void> {
    const business = await this.findOne(id);
    if (!business) {
      throw new CustomException({
        statusCode: 404,
        message: 'Business not found',
        code: ResponseCodes.BUSINESS_NOT_FOUND,
        traceId,
        meta: { businessId: id }
      });
    }
    if (business.isActive === false) {
      throw new CustomException({
        statusCode: 400,
        message: 'Business is already deactivated',
        code: ResponseCodes.BUSINESS_DEACTIVATED,
        traceId,
        meta: { businessId: id }
      });
    }
    business.isActive = false;
    await business.save();
  }

  async activateBusiness(id: string, traceId: string): Promise<void> {
    const business = await this.findOne(id);
    if (!business) {
      throw new CustomException({
        statusCode: 404,
        message: 'Business not found',
        code: ResponseCodes.BUSINESS_NOT_FOUND,
        traceId,
        meta: { businessId: id }
      });
    }
    if (business.isActive === true) {
      throw new CustomException({
        statusCode: 400,
        message: 'Business is already active',
        code: ResponseCodes.BUSINESS_ALREADY_ACTIVATED,
        traceId,
        meta: { businessId: id }
      });
    }
    business.isActive = true;
    await business.save();
  }
}