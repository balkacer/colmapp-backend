import { PaymentMethod } from "@colmapp/types";
import StripePaymentProvider from "../providers/stripePayment.provider";
import { IPaymentProcessor } from "../types/paymentProcessor.interface";
import { IPaymentResult } from "../types/paymentResult.interface";
import { CustomException } from "@colmapp/exceptions";
import { ResponseCodes } from "libs/types/responseCodes";
import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "../dto/create-payment.dto";

@Injectable()
export class CardPaymentsProcessor implements IPaymentProcessor {
  readonly method = PaymentMethod.CARD;
  private provider: StripePaymentProvider;

  constructor() {
    const key = process.env.STRIPE_API_KEY;
    if (!key) throw new CustomException({
        message: "Stripe api key not set in env",
        code: ResponseCodes.ENV_VAR_NOT_FOUND,
        statusCode: 500,
        traceId: "N/A",
        meta: {}
    })
    this.provider = new StripePaymentProvider(key);
  }

  async create(dto: Required<CreatePaymentDto>, traceId?: string, meta?: Record<string, any>): Promise<IPaymentResult> {
    return this.provider.createPayment(dto.amount, dto.currency, dto.paymentMethodId, meta, traceId);
  }

  async capture(paymentId: string, traceId?: string): Promise<IPaymentResult> {
    return this.provider.capturePayment(paymentId, traceId);
  }

  async refund(paymentId: string, amount?: number, traceId?: string): Promise<IPaymentResult> {
    return this.provider.refundPayment(paymentId, amount, traceId);
  }

  async get(paymentId: string, traceId?: string): Promise<IPaymentResult> {
    return this.provider.getPayment(paymentId, traceId);
  }
}