import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './schemas/order.schema';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'create_order' })
  async create(@Payload() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'find_all_orders' })
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @MessagePattern({ cmd: 'find_order_by_id' })
  async findById(@Payload() id: string): Promise<Order> {
    return this.ordersService.findById(id);
  }

  @MessagePattern({ cmd: 'update_order_status' })
  async updateStatus(
    @Payload() data: { id: string; updateOrderStatusDto: UpdateOrderStatusDto },
  ): Promise<Order> {
    return this.ordersService.updateStatus(
      data.id,
      data.updateOrderStatusDto,
    );
  }

  @MessagePattern({ cmd: 'remove_order' })
  async remove(@Payload() id: string): Promise<void> {
    return this.ordersService.remove(id);
  }
}