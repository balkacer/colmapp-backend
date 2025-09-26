import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { generateOrderNumber } from '@colmapp/utils';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @Inject('CUSTOMERS_SERVICE') private readonly customersClient: ClientProxy,
    @Inject('PROVIDERS_SERVICE') private readonly providersClient: ClientProxy,
    @Inject('PRODUCTS_SERVICE') private readonly productsClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
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
    
    const provider = await firstValueFrom(
      this.providersClient.send('providers.findOne', {
        id: createOrderDto.providerId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET,
      }).pipe(
        timeout(10000),
        retry(3),
      ),
    );

    if (!provider) {
      throw new NotFoundException(
        `Provider with id ${createOrderDto.customerId} not found`,
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
      providerId: createOrderDto.providerId,
      items: createOrderDto.items,
      totalAmount,
      orderNumber: generateOrderNumber(6),
      status: OrderStatus.PENDING,
    });

    const saved = await order.save();

    this.notificationsClient.emit('notifications.orderCreated', { orderNumber: saved.orderNumber, userId: customer.userId, traceId, serviceSecret: process.env.SERVICE_SECRET }).pipe(
      timeout(10000),
      retry(3),
    )

    this.notificationsClient.emit('notifications.orderRequested', { orderNumber: saved.orderNumber, userId: provider.userId, traceId, serviceSecret: process.env.SERVICE_SECRET }).pipe(
      timeout(10000),
      retry(3),
    )

    return saved;
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

    const customer = await firstValueFrom(this.customersClient.send('customers.findOne', { id: order.customerId, traceId }))

    if (updateOrderStatusDto.status === OrderStatus.ACCEPTED) {
      this.notificationsClient.emit('notifications.orderAccepted', { orderNumber: order.orderNumber, userId: customer.userId, traceId, serviceSecret: process.env.SERVICE_SECRET })
    } else if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
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

      this.notificationsClient.emit('notifications.orderCancelled', { orderNumber: order.orderNumber, userId: customer.userId, traceId, serviceSecret: process.env.SERVICE_SECRET })
    } else if (updateOrderStatusDto.status === OrderStatus.DELIVERED) {
      this.notificationsClient.emit('notifications.orderDelivered', { orderNumber: order.orderNumber, userId: customer.userId, traceId, serviceSecret: process.env.SERVICE_SECRET })
    } else if (updateOrderStatusDto.status === OrderStatus.PAID) {
      this.notificationsClient.emit('notifications.orderPaid', { orderNumber: order.orderNumber, userId: customer.userId, traceId, serviceSecret: process.env.SERVICE_SECRET })
    } else if (updateOrderStatusDto.status === OrderStatus.REJECTED) {
      this.notificationsClient.emit('notifications.orderRejected', { orderNumber: order.orderNumber, userId: customer.userId, reason: "", traceId, serviceSecret: process.env.SERVICE_SECRET })
    } else if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
      this.notificationsClient.emit('notifications.orderShipped', { orderNumber: order.orderNumber, userId: customer.userId, deliveryPerson: "", traceId, serviceSecret: process.env.SERVICE_SECRET })
    } else {
      console.log('ELSE');
    }

    return order;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Order with id ${id} not found`);
    return { message: 'Order deleted successfully' };
  }

  async cancelOrdersByCustomer(customerId: string, traceId?: string): Promise<void> {
    const orders = await this.orderModel.find({
      customerId,
      status: {
        $in: [
          OrderStatus.PENDING,
          OrderStatus.ACCEPTED,
        ]
      }
    }).exec();

    for (const order of orders) {
      order.status = OrderStatus.CANCELLED;
      const saved = await order.save();

      this.notificationsClient.emit('notifications.orderCancelledByCustomer', { orderNumber: saved.orderNumber, userId: saved.providerId, traceId, serviceSecret: process.env.SERVICE_SECRET })
    }
  }

  async markAsPaid(id: string, paymentId: string, traceId?: string): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        id,
        { status: OrderStatus.PAID, paymentId },
        { new: true },
      )
      .exec();

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    this.notificationsClient.emit('notifications.orderPaid', { orderNumber: order.orderNumber, userId: order.providerId, traceId, serviceSecret: process.env.SERVICE_SECRET })

    return order;
  }
}