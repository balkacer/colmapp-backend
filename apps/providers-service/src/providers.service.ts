import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(@InjectModel(Provider.name) private providerModel: Model<ProviderDocument>) {}

  async create(dto: CreateProviderDto): Promise<Provider> {
    const provider = new this.providerModel(dto);
    return provider.save();
  }

  async findAll(): Promise<Provider[]> {
    return this.providerModel.find().exec();
  }

  async findOne(id: string): Promise<Provider> {
    const provider = await this.providerModel.findById(id).exec();
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async update(id: string, dto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.providerModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.providerModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Provider not found');
    return { message: 'Provider deleted successfully'}
  }
}