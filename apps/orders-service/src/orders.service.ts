import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @Inject('CUSTOMERS_SERVICE') private readonly customersClient: ClientProxy,
    @Inject('PRODUCTS_SERVICE') private readonly productsClient: ClientProxy,
  ) { }

  async create(createOrderDto: CreateOrderDto, traceId?: string): Promise<Order> {
    const customer = await firstValueFrom(
      this.customersClient.send('customers.findOne', {
        id: createOrderDto.customerId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET,
      }).pipe(
        timeout(10000),
        retry(3),
      ),
    );

    if (!customer) {
      throw new NotFoundException(
        `Customer with id ${createOrderDto.customerId} not found`,
      );
    }

    for (const item of createOrderDto.items) {
      const product = await firstValueFrom(
        this.productsClient.send('products.findOne', {
          id: item.productId,
          traceId,
          serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
          timeout(10000),
          retry(3),
        ),
      );
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Not enough stock for product ${item.productId}`);
      }
    }

    for (const item of createOrderDto.items) {
      await firstValueFrom(
        this.productsClient.send('products.decreaseStock', {
          productId: item.productId,
          quantity: item.quantity,
          traceId,
          serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(
          timeout(10000),
          retry(3),
        ),
      );
    }

    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = new this.orderModel({
      customerId: createOrderDto.customerId,
      items: createOrderDto.items,
      totalAmount,
      status: OrderStatus.PENDING,
    });

    return order.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return order;
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    traceId?: string,
  ): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        id,
        { status: updateOrderStatusDto.status },
        { new: true },
      )
      .exec();

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await firstValueFrom(
          this.productsClient.send('products.increaseStock', {
            productId: item.productId,
            quantity: item.quantity,
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
          }).pipe(
            timeout(10000),
            retry(3),
          ),
        );
      }
    }
    return order;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Order with id ${id} not found`);
    return { message: 'Order deleted successfully' };
  }

  async cancelOrdersByCustomer(customerId: string): Promise<void> {
    await this.orderModel
      .updateMany(
        {
          customerId, status: {
            $in: [
              OrderStatus.PENDING,
              OrderStatus.PROCESSING,
              OrderStatus.ACCEPTED
            ]
          }
        },
        { status: OrderStatus.CANCELLED },
      )
      .exec();
  }

  async markAsPaid(id: string, paymentId: string): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        id,
        { status: OrderStatus.PAID, paymentId },
        { new: true },
      )
      .exec();

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    return order;
  }
}