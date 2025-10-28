import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethod } from "@colmapp/types";
import { IPaymentProcessor } from "../types/paymentProcessor.interface";
import { IPaymentResult } from "../types/paymentResult.interface";
import { CreatePaymentDto } from "../dto/create-payment.dto";
import { PaymentStatus } from "../types/paymentStatus.enum";

@Injectable()
export class TransferPaymentsProcessor implements IPaymentProcessor {
  readonly method = PaymentMethod.TRANSFER;
  private readonly logger = new Logger(TransferPaymentsProcessor.name);
  private storedPayments: Map<string, IPaymentResult> = new Map();
  constructor() { }

  /**
   * Crea un pago por transferencia bancaria.
   * El estado inicial siempre es PENDING hasta confirmar manualmente el depósito.
   */
  async create(dto: CreatePaymentDto, traceId?: string): Promise<IPaymentResult> {
    this.logger.log(`[TraceId: ${traceId}] Creating TRANSFER payment for order ${dto.orderId}`);

    const result: IPaymentResult = {
      id: `TRF-${Date.now()}`,
      status: PaymentStatus.PENDING,
      method: this.method,
      amount: dto.amount,
      currency: dto.currency,
      provider: "transfer",
      externalStatus: "awaiting_bank_confirmation",
      message: "Transfer registered, pending bank confirmation",
      raw: {
        createdAt: new Date().toISOString(),
        orderId: dto.orderId,
      },
    };

    this.storedPayments.set(result.id, result);

    this.logger.log(`[TraceId: ${traceId}] Transfer payment created: ${result.id}`);
    return result;
  }

  /**
   * Captura o confirma el pago cuando se valida la transferencia.
   */
  async capture(paymentId: string, traceId?: string): Promise<IPaymentResult> {
    this.logger.log(`[TraceId: ${traceId}] Confirming TRANSFER payment ${paymentId}`);

    const payment = this.storedPayments.get(paymentId);

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    // Actualizar el estado del pago a SUCCESS
    // En un caso real, se actualizaría el registro en BD 
    payment.status = PaymentStatus.CAPTURED;
    payment.externalStatus = "confirmed";
    payment.message = "Transfer confirmed and funds received";
    payment.raw = {
      ...payment.raw,
      confirmedAt: new Date().toISOString(),
    };

    this.storedPayments.set(paymentId, payment);

    this.logger.log(`[TraceId: ${traceId}] Transfer payment ${paymentId} confirmed as SUCCESS`);
    return payment;
  }

  /**
   * Obtiene la información actual del pago por transferencia (simulada).
   */
  async get(paymentId: string, traceId?: string): Promise<IPaymentResult> {
    this.logger.log(`[TraceId: ${traceId}] Fetching TRANSFER payment ${paymentId}`);

    const payment = this.storedPayments.get(paymentId);

    if (!payment) {
      this.logger.warn(`[TraceId: ${traceId}] Payment ${paymentId} not found`);
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    const result: IPaymentResult = {
      id: payment.id,
      status: payment.status,
      method: this.method,
      amount: payment.amount,
      currency: payment.currency,
      provider: "transfer",
      externalStatus: payment.externalStatus,
      message: payment.message,
      raw: {
        ...payment.raw,
        fetchedAt: new Date().toISOString(),
      },
    };

    this.logger.log(`[TraceId: ${traceId}] Transfer payment ${paymentId} fetched successfully`);
    
    return result;
  }

    /**
   * Simula un webhook bancario que auto-confirma la transferencia si está pendiente.
   * Si el pago está en estado PENDING, lo marca como CAPTURED, cambia externalStatus y agrega confirmedAt.
   * Registra logs antes y después. Si no existe o no está pendiente, registra un warning.
   * @param paymentId
   * @param traceId
   * @returns IPaymentResult actualizado
   */
  async simulateBankWebhook(paymentId: string, traceId?: string): Promise<IPaymentResult | undefined> {
    this.logger.log(`[TraceId: ${traceId}] Simulating bank webhook for payment ${paymentId}`);
    const payment = this.storedPayments.get(paymentId);
    if (!payment) {
      this.logger.warn(`[TraceId: ${traceId}] simulateBankWebhook: Payment ${paymentId} not found`);
      return undefined;
    }
    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.warn(`[TraceId: ${traceId}] simulateBankWebhook: Payment ${paymentId} is not pending (current status: ${payment.status})`);
      return payment;
    }
    payment.status = PaymentStatus.CAPTURED;
    payment.externalStatus = "confirmed_via_webhook";
    payment.message = "Transfer confirmed automatically via webhook";
    payment.raw = {
      ...payment.raw,
      confirmedAt: new Date().toISOString(),
    };
    this.storedPayments.set(paymentId, payment);
    this.logger.log(`[TraceId: ${traceId}] simulateBankWebhook: Payment ${paymentId} confirmed via webhook`);
    return payment;
  }
}