import { Controller, UseGuards } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @MessagePattern('orders.create')
  async create(@Payload() payload: CreateOrderDto & { traceId: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating order for customer: `, dto.customerId);
    return this.ordersService.create(dto);
  }

  @MessagePattern('orders.findAll')
  async findAll(@Payload() payload: { traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all orders`);
    return this.ordersService.findAll();
  }

  @MessagePattern('orders.findOne')
  async findOne(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching order with id: `, id);
    return this.ordersService.findOne(id);
  }

  @MessagePattern('orders.updateStatus')
  async updateStatus(
    @Payload() payload: { id: string; dto: UpdateOrderStatusDto, traceId: string },
  ) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating status for order id: `, id, ' to ', dto.status);
    return this.ordersService.updateStatus(id, dto);
  }

  @MessagePattern('orders.remove')
  async remove(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing order with id: `, id);
    return this.ordersService.remove(id);
  }

  @EventPattern('orders.customerRemoved')
  async handleCustomerRemoved(@Payload() payload: { customerId: string, traceId: string }) {
    const { customerId, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Handling customer removal for customerId: `, customerId);
    await this.ordersService.cancelOrdersByCustomer(customerId);
  }

  @EventPattern('orders.markAsPaid')
  async handleOrderPaid(@Payload() payload: { orderId: string, paymentId: string, traceId: string }) {
    const { orderId, paymentId, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Marking order as paid for orderId: `, orderId);
    await this.ordersService.markAsPaid(orderId, paymentId);
  }
}