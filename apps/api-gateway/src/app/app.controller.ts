import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from 'libs/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.appService.getApiStatus();
  }
}
