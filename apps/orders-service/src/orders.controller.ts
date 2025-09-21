import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @MessagePattern('orders.create')
  async create(@Payload() payload: CreateOrderDto & { traceId: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating order for customer:`, dto.customerId);
    return this.ordersService.create(dto);
  }

  @MessagePattern('orders.findAll')
  async findAll(@Payload() payload: { traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all orders`);
    return this.ordersService.findAll();
  }

  @MessagePattern('orders.findOne')
  async findById(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching order with id:`, id);
    return this.ordersService.findById(id);
  }

  @MessagePattern('orders.updateStatus')
  async updateStatus(
    @Payload() payload: { id: string; dto: UpdateOrderStatusDto, traceId: string },
  ) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating status for order id:`, id, 'to', dto.status);
    return this.ordersService.updateStatus(id, dto);
  }

  @MessagePattern('orders.remove')
  async remove(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing order with id:`, id);
    return this.ordersService.remove(id);
  }
}