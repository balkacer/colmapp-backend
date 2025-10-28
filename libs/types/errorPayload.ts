import { ResponseCodes } from "./responseCodes";

export interface ErrorPayload {
  statusCode: number;
  message: string;
  code?: ResponseCodes;
  traceId?: string;
  meta?: any;
}
