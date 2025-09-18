import { Module } from '@nestjs/common';
import { ProvidersServiceController } from './providers-service.controller';
import { ProvidersServiceService } from './providers-service.service';

@Module({
  imports: [],
  controllers: [ProvidersServiceController],
  providers: [ProvidersServiceService],
})
export class ProvidersServiceModule {}
