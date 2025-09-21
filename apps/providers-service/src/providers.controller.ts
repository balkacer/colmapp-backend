import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Controller()
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) { }

  @MessagePattern('providers.create')
  create(@Payload() payload: CreateProviderDto & { traceId: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating provider:`, dto.name);
    return this.providersService.create(dto);
  }

  @MessagePattern('providers.findAll')
  findAll(@Payload() payload: { traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all providers`);
    return this.providersService.findAll();
  }

  @MessagePattern('providers.findOne')
  findOne(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching provider with id:`, id);
    return this.providersService.findOne(id);
  }

  @MessagePattern('providers.update')
  update(@Payload() payload: { id: string; dto: UpdateProviderDto, traceId: string }) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating provider with id:`, id, 'to', dto);
    return this.providersService.update(payload.id, payload.dto);
  }

  @MessagePattern('providers.remove')
  remove(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing provider with id:`, id);
    return this.providersService.remove(id);
  }
}