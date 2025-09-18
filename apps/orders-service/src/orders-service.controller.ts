import { Controller, Get } from '@nestjs/common';
import { OrdersServiceService } from './orders-service.service';

@Controller()
export class OrdersServiceController {
  constructor(private readonly ordersServiceService: OrdersServiceService) {}

  @Get()
  getHello(): string {
    return this.ordersServiceService.getHello();
  }
}
