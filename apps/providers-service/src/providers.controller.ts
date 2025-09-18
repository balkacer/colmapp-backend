import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Controller()
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @MessagePattern('providers.create')
  create(@Payload() dto: CreateProviderDto) {
    return this.providersService.create(dto);
  }

  @MessagePattern('providers.findAll')
  findAll() {
    return this.providersService.findAll();
  }

  @MessagePattern('providers.findOne')
  findOne(@Payload() id: string) {
    return this.providersService.findOne(id);
  }

  @MessagePattern('providers.update')
  update(@Payload() data: { id: string; dto: UpdateProviderDto }) {
    return this.providersService.update(data.id, data.dto);
  }

  @MessagePattern('providers.remove')
  remove(@Payload() id: string) {
    return this.providersService.remove(id);
  }
}