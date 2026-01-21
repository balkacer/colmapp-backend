import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @MessagePattern('business.create')
  create(@Payload() payload: CreateBusinessDto & { traceId: string; serviceSecret: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing creation for business: `, dto.email);
    return this.businessService.create(dto, traceId);
  }

  @MessagePattern('business.findAll')
  findAll(@Payload() payload: { serviceSecret: string; traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all businesses`);
    return this.businessService.findAll(traceId);
  }

  @MessagePattern('business.findOne')
  findOne(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching business with ID: `, id);
    return this.businessService.findOne(id, traceId);
  }

  @MessagePattern('business.update')
  update(@Payload() payload: UpdateBusinessDto & { userId: string, traceId: string; serviceSecret: string }) {
    const { traceId, userId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Processing update for business: `, dto.email);
    return this.businessService.update(userId, dto, traceId);
  }

  @MessagePattern('business.remove')
  remove(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing business with ID: `, id);
    return this.businessService.remove(id, traceId);
  }

  @MessagePattern('business.activate')
  activate(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Activating business with ID: `, id);
    return this.businessService.activateBusiness(id, traceId);
  }

  @MessagePattern('business.deactivate')
  deactivate(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Deactivating business with ID: `, id);
    return this.businessService.deactivateBusiness(id, traceId);
  }
}