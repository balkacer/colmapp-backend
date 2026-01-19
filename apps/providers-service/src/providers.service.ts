import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';

@Injectable()
export class ProvidersService {
  constructor(@InjectModel(Provider.name) private providerModel: Model<ProviderDocument>) {}

  async create(dto: CreateProviderDto, traceId?: string): Promise<Provider> {
    // Validate required fields
    const { name, email, phone, address } = dto || {};
    if (!name || !email || !phone || !address
      || typeof name !== 'string' || typeof email !== 'string' || typeof phone !== 'string' || typeof address !== 'string'
      || name.trim() === '' || email.trim() === '' || phone.trim() === '' || address.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Missing or invalid required fields',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
        meta: { dto }
      });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid email format',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
        meta: { email }
      });
    }
    // Validate phone: digits only, length 8-15
    const phoneRegex = /^\d{8,15}$/;
    if (!phoneRegex.test(phone)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid phone format',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
        meta: { phone }
      });
    }
    // Check for existing provider by email or phone
    const exists = await this.providerModel.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    }).exec();
    if (exists) {
      throw new CustomException({
        statusCode: 409,
        message: 'Provider already exists',
        code: ResponseCodes.PROVIDER_ALREADY_EXISTS,
        traceId,
        meta: { email, phone }
      });
    }
    const provider = new this.providerModel(dto);
    return provider.save();
  }

  async findAll(): Promise<Provider[]> {
    return this.providerModel.find().exec();
  }

  async findOne(id: string, traceId?: string): Promise<Provider> {
    const provider = await this.providerModel.findById(id).exec();
    if (!provider) throw new CustomException({
      statusCode: 404,
      message: 'Provider not found',
      code: ResponseCodes.PROVIDER_NOT_FOUND,
      traceId,
      meta: { providerId: id }
    });
    return provider;
  }

  async update(id: string, dto: UpdateProviderDto, traceId?: string): Promise<Provider> {
    // Validate id
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid provider id',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
        meta: { id }
      });
    }
    // Validate DTO is not empty
    if (!dto || Object.keys(dto).length === 0) {
      throw new CustomException({
        statusCode: 400,
        message: 'Update DTO cannot be empty',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
        meta: { id }
      });
    }
    const provider = await this.providerModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!provider) throw new CustomException({
      statusCode: 404,
      message: 'Provider not found',
      code: ResponseCodes.PROVIDER_NOT_FOUND,
      traceId,
      meta: { providerId: id }
    });
    return provider;
  }

  async remove(id: string, traceId?: string): Promise<{ message: string }> {
    // Validate id
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid provider id',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
        meta: { id }
      });
    }
    const provider = await this.providerModel.findByIdAndDelete(id).exec();
    if (!provider) throw new CustomException({
      statusCode: 404,
      message: 'Provider not found',
      code: ResponseCodes.PROVIDER_NOT_FOUND,
      traceId,
      meta: { providerId: id }
    });
    return { message: 'Provider deleted successfully'}
  }
}