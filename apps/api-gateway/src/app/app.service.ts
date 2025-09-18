import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  public getApiStatus() {
    return {
      status: 'API is running',
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    }
  }
}
