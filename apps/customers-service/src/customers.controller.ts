import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @MessagePattern('customers.create')
  create(@Payload() payload: CreateCustomerDto & { traceId: string; serviceSecret: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating customer: `, dto.name);
    return this.customersService.create(dto, traceId);
  }

  @MessagePattern('customers.findAll')
  findAll(@Payload() payload: { serviceSecret: string; traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all Customers`);
    return this.customersService.findAll(traceId);
  }

  @MessagePattern('customers.findOne')
  findOne(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching Customer with id: `, id);
    return this.customersService.findOne(id, traceId);
  }

  @MessagePattern('customers.update')
  update(@Payload() payload: { serviceSecret: string; id: string; dto: UpdateCustomerDto, traceId: string }) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating Customer with id: `, id, ' to ', dto);
    return this.customersService.update(payload.id, payload.dto, traceId);
  }

  @MessagePattern('customers.remove')
  remove(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing Customer with id: `, id);
    return this.customersService.remove(id, traceId);
  }
}