import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { ClientProxy } from '@nestjs/microservices';
import { retry, timeout } from 'rxjs';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @Inject('ORDERS_SERVICE') private readonly ordersClient: ClientProxy,
  ) { }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = new this.customerModel(dto);
    return customer.save();
  }

  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().exec();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.customerModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Customer not found');
    this.ordersClient.emit('orders.customerRemoved', { customerId: result._id }).pipe(
      timeout(10000),
      retry(3),
    );
    return { message: 'Customer deleted successfully' }
  }
}