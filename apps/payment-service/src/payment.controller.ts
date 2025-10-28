import { Controller, Get, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @MessagePattern('payment.create')
  create(@Payload() payload: { serviceSecret: string; dto: CreatePaymentDto, traceId: string }) {
    const { traceId, dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating payment for order: `, dto.orderId);
    return this.paymentService.processPayment(dto, traceId);
  }
}