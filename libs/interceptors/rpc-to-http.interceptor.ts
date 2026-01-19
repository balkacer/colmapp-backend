import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ResponseCodes } from '@colmapp/types';

@Injectable()
export class RpcToHttpInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        const errorPayload =
          err?.response || err?.error || err;

        if (errorPayload?.statusCode && errorPayload?.message) {
          const traceId = errorPayload.traceId || context.switchToHttp().getRequest()?.headers['x-trace-id'];
          const response = {
            success: false,
            statusCode: errorPayload.statusCode || 500,
            message: errorPayload.message || 'Internal server error',
            code: errorPayload.code || ResponseCodes.UNKNOWN_ERROR,
            traceId,
            meta: errorPayload.meta,
            timestamp: new Date().toISOString(),
          };
          return throwError(
            () => new HttpException(response, errorPayload.statusCode)
          );
        }

        // ⚠️ Si es otro tipo de error no estructurado
        return throwError(() =>
          new HttpException(
            {
              success: false,
              statusCode: 500,
              message: 'Internal server error',
              code: ResponseCodes.UNKNOWN_ERROR,
              timestamp: new Date().toISOString(),
            },
            500,
          ),
        );
      }),
    );
  }
}