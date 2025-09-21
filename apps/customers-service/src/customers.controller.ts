import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @MessagePattern('customers.create')
  create(@Payload() payload: CreateCustomerDto & { traceId: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating customer:`, dto.name);
    return this.customersService.create(dto);
  }

  @MessagePattern('customers.findAll')
  findAll(@Payload() payload: { traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all Customers`);
    return this.customersService.findAll();
  }

  @MessagePattern('customers.findOne')
  findOne(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching Customer with id:`, id);
    return this.customersService.findOne(id);
  }

  @MessagePattern('customers.update')
  update(@Payload() payload: { id: string; dto: UpdateCustomerDto, traceId: string }) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating Customer with id:`, id, 'to', dto);
    return this.customersService.update(payload.id, payload.dto);
  }

  @MessagePattern('customers.remove')
  remove(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing Customer with id:`, id);
    return this.customersService.remove(id);
  }
}