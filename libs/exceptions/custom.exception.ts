import { RpcException } from '@nestjs/microservices';
import { ErrorPayload } from 'libs/types';


export class CustomException extends RpcException {
  constructor(payload: ErrorPayload) {
    super(payload);
  }
}