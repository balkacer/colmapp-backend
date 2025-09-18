import { Controller, Get } from '@nestjs/common';
import { ProvidersServiceService } from './providers-service.service';

@Controller()
export class ProvidersServiceController {
  constructor(private readonly providersServiceService: ProvidersServiceService) {}

  @Get()
  getHello(): string {
    return this.providersServiceService.getHello();
  }
}
