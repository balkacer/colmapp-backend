import { Controller, UseGuards } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ServiceAuthGuard } from '@colmapp/guards';
import { OrderStatus } from './schemas/order.schema';

@Controller()
@UseGuards(ServiceAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @MessagePattern('orders.create')
  async create(@Payload() payload: CreateOrderDto & { traceId: string; serviceSecret: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating order for customer: `, dto.customerId);
    return this.ordersService.create(dto, traceId);
  }

  @MessagePattern('orders.findAll')
  async findAll(@Payload() payload: { serviceSecret: string; traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all orders`);
    return this.ordersService.findAll();
  }

  @MessagePattern('orders.findOne')
  async findOne(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching order with id: `, id);
    return this.ordersService.findOne(id);
  }

  @MessagePattern('orders.updateStatus')
  async updateStatus(
    @Payload() payload: { serviceSecret: string; id: string; dto: UpdateOrderStatusDto, traceId: string },
  ) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating status for order id: `, id, ' to ', dto.status);
    return this.ordersService.updateStatus(id, dto, traceId);
  }

  @MessagePattern('orders.remove')
  async remove(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing order with id: `, id);
    return this.ordersService.remove(id);
  }

  @MessagePattern('orders.cancel')
  async cancel(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Canceling order with id: `, id);
    return this.ordersService.updateStatus(id, { status: OrderStatus.CANCELLED }, traceId);
  }

  @EventPattern('orders.customerRemoved')
  async handleCustomerRemoved(@Payload() payload: { serviceSecret: string; customerId: string, traceId: string }) {
    const { customerId, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Handling customer removal for customerId: `, customerId);
    await this.ordersService.cancelOrdersByCustomer(customerId, traceId);
  }

  @EventPattern('orders.markAsPaid')
  async handleOrderPaid(@Payload() payload: { serviceSecret: string; orderId: string, paymentId: string, traceId: string }) {
    const { orderId, paymentId, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Marking order as paid for orderId: `, orderId);
    await this.ordersService.markAsPaid(orderId, paymentId, traceId);
  }
}