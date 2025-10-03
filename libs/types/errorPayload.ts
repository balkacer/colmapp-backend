import { ResposeCodes } from "./responseCodes";

export interface ErrorPayload {
  statusCode: number;
  message: string;
  code?: ResposeCodes;
  traceId?: string;
  meta?: any;
}
