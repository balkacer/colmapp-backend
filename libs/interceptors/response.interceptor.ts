import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const traceId = context.switchToHttp().getRequest()?.headers['x-trace-id'] || randomUUID();

    return next.handle().pipe(
      map((data) => {
        // Detectar tipo de contexto (HTTP o RPC)
        const ctxType = context.getType();

        // Obtener status code
        let statusCode = 200;
        if (ctxType === 'http') {
          const response = context.switchToHttp().getResponse();
          statusCode = response.statusCode;
        }

        // Estructura estándar
        return {
          success: true,
          statusCode,
          code: 'OK',
          message: this.resolveMessage(data),
          data: this.resolveData(data),
          traceId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  /**
   * Si el handler devuelve un objeto con 'message' o 'data', lo usa.
   * Si es un string o cualquier otro valor, lo formatea automáticamente.
   */
  private resolveMessage(data: any): string {
    if (!data) return 'OK';
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    return 'Success';
  }

  private resolveData(data: any): any {
    if (!data) return null;
    if (data?.data) return data.data;
    if (data?.message && Object.keys(data).length === 1) return null;
    return data;
  }
}