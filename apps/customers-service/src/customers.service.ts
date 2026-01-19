import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { ClientProxy } from '@nestjs/microservices';
import { retry, timeout } from 'rxjs';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @Inject('ORDERS_SERVICE') private readonly ordersClient: ClientProxy,
  ) { }

  async create(dto: CreateCustomerDto, traceId?: string): Promise<Customer> {
    const customer = new this.customerModel(dto);
    return customer.save();
  }

  async findAll(traceId?: string): Promise<Customer[]> {
    return this.customerModel.find().exec();
  }

  async findOne(id: string, traceId?: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) throw new CustomException({
      statusCode: 404,
      message: 'Customer not found',
      code: ResponseCodes.CUSTOMER_NOT_FOUND,
      traceId
    });
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, traceId?: string): Promise<Customer> {
    const customer = await this.customerModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!customer) throw new CustomException({
      statusCode: 404,
      message: 'Customer not found',
      code: ResponseCodes.CUSTOMER_NOT_FOUND,
      traceId
    });
    return customer;
  }

  async remove(id: string, traceId?: string): Promise<{ message: string }> {
    const result = await this.customerModel.findByIdAndDelete(id).exec();
    if (!result) throw new CustomException({
      statusCode: 404,
      message: 'Customer not found',
      code: ResponseCodes.CUSTOMER_NOT_FOUND,
      traceId
    });
    this.ordersClient.emit('orders.customerRemoved', {
      customerId: result._id,
      traceId,
      serviceSecret: process.env.SERVICE_SECRET
    }).pipe(
      timeout(8000),
      retry(1),
    );
    return { message: 'Customer deleted successfully' }
  }
}