import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @Inject('ORDERS_SERVICE') private readonly ordersClient: ClientProxy,
  ) { }

  async create(dto: CreatePaymentDto, traceId?: string): Promise<Payment> {
    const order = await firstValueFrom(
      this.ordersClient.send('orders.findOne', { id: dto.orderId, traceId }).pipe(
        timeout(10000),
        retry(3),
      ),
    );
    if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

    const payment = new this.paymentModel({
      ...dto,
      status: PaymentStatus.SUCCESS,
    });
    const saved = await payment.save();

    this.ordersClient.emit('orders.markAsPaid', {
      orderId: dto.orderId,
      paymentId: saved._id,
      traceId
    }).pipe(
      timeout(10000),
      retry(3),
    );

    return saved;
  }
}