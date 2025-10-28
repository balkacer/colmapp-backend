import { CustomException } from '@colmapp/exceptions';
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { ResponseCodes } from 'libs/types/responseCodes';

@Catch()
export class RpcGlobalExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof CustomException) {
      return super.catch(exception, host);
    }

    const traceId = host.switchToRpc().getData()?.traceId;
    const error = {
      success: false,
      statusCode: exception.statusCode || 500,
      message: exception.message || 'Unhandled error',
      code: exception.code || ResponseCodes.UNKNOWN_ERROR,
      traceId,
      meta: exception.meta,
      timestamp: new Date().toISOString(),
    };

    throw new CustomException(error);
  }
}