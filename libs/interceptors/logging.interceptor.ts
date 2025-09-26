import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

const SENSITIVE_KEYS = ['password', 'pass', 'token', 'secret', 'authorization', 'apikey'];

function maskSensitive(input: any): any {
  try {
    if (input == null || typeof input !== 'object') return input;
    return JSON.parse(
      JSON.stringify(input, (key, value) => {
        const isSensitiveKey = SENSITIVE_KEYS.reduce((p, c) => p || key.toLowerCase().includes(c), false);

        if (typeof key === 'string' && isSensitiveKey) {
          return '[REDACTED]';
        }

        return value;
      }),
    );
  } catch {
    return input;
  }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startedAt = Date.now();
    const ctxType = context.getType<'http' | 'rpc'>();

    const handlerName = context.getHandler()?.name ?? 'anonymous';
    const controllerName = (context.getClass() as any)?.name ?? 'UnknownController';

    let traceId: string = randomUUID();
    let httpRes: any | undefined;
    let details: any = { handler: `${controllerName}.${handlerName}` };

    if (ctxType === 'http') {
      const req = context.switchToHttp().getRequest();
      traceId = (req.headers?.['x-trace-id'] as string) || traceId;
      req.traceId = traceId;

      details = {
        ...details,
        method: req.method,
        url: req.url,
        body: maskSensitive(req.body),
      };

      httpRes = context.switchToHttp().getResponse();
      this.logger.log(`[TraceId: ${traceId}] → HTTP Request ${JSON.stringify(details)}`);
    } else if (ctxType === 'rpc') {
      const rpc = context.switchToRpc();
      const data = rpc.getData();
      traceId = (data?.traceId as string) || traceId;

      const rpcCtx: any =
        typeof (rpc as any).getContext === 'function' ? (rpc as any).getContext() : undefined;

      let rpcPattern: any;
      try {
        rpcPattern =
          (rpcCtx && typeof rpcCtx.getPattern === 'function' && rpcCtx.getPattern()) ||
          rpcCtx?.pattern ||
          undefined;
      } catch {
        rpcPattern = undefined;
      }

      details = {
        ...details,
        rpcPattern,
        data: maskSensitive(data),
      };

      this.logger.log(`[TraceId: ${traceId}] → RPC Request ${JSON.stringify(details)}`);
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          if (ctxType === 'http' && httpRes) {
            if (typeof httpRes.setHeader === 'function') {
              httpRes.setHeader('x-trace-id', traceId);
            } else if (typeof httpRes.header === 'function') {
              httpRes.header('x-trace-id', traceId);
            }
          }
          const elapsed = Date.now() - startedAt;
          this.logger.log(
            `[TraceId: ${traceId}] ← Response ${JSON.stringify(maskSensitive(response))} (${elapsed}ms)`,
          );
        },
        error: (err) => {
          const elapsed = Date.now() - startedAt;
          this.logger.error(
            `[TraceId: ${traceId}] ✖ Error after ${elapsed}ms: ${err?.message}`,
            err?.stack,
          );
        },
      }),
    );
  }
}