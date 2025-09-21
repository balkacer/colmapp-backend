import { Controller, Get, Post, Patch, Delete, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('orders')
export class OrdersController {

  constructor(
    @Inject('ORDERS_SERVICE') private ordersClient: ClientProxy
  ) {
  }

  @Post()
  create(@Body() createOrderDto: any) {
    return this.ordersClient.send({ cmd: 'create_order' }, createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersClient.send({ cmd: 'find_all_orders' }, {});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersClient.send({ cmd: 'find_order_by_id' }, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: any,
  ) {
    return this.ordersClient.send({ cmd: 'update_order_status' }, { id, updateOrderStatusDto });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersClient.send({ cmd: 'remove_order' }, id);
  }
}