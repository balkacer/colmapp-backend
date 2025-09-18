import { Injectable } from '@nestjs/common';

@Injectable()
export class ProvidersServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
