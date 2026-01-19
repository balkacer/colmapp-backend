import { Inject, Injectable, Logger } from '@nestjs/common';
import { PaymentMethod, ResponseCodes } from '@colmapp/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CardPaymentsProcessor } from './services/cardPayments.processor';
import { CashPaymentsProcessor } from './services/cashPayments.processor';
import { TransferPaymentsProcessor } from './services/transferPayments.processor';
import { CustomException } from '@colmapp/exceptions';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './schemas/payment.schema';
import { IPaymentProcessor } from './types/paymentProcessor.interface';
import { IPaymentResult } from './types/paymentResult.interface';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentStatus } from './types/paymentStatus.enum';


/**
 * Orquestador general de pagos.
 * - Aplica validaciones comunes
 * - Escoge el processor según el método
 * - Controla persistencia y notificaciones
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly processors: Record<PaymentMethod, IPaymentProcessor> = {
    [PaymentMethod.CARD]: new CardPaymentsProcessor(),
    [PaymentMethod.TRANSFER]: new TransferPaymentsProcessor(),
    [PaymentMethod.CASH]: new CashPaymentsProcessor(),
  };

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @Inject('ORDERS_SERVICE') private readonly ordersClient: ClientProxy,
    @Inject('CUSTOMERS_SERVICE') private readonly customersClient: ClientProxy
  ) { }

  /**
   * Procesa un pago según su método.
   * Aplica validaciones comunes, crea el registro en BD y delega al processor.
   */
  async processPayment(dto: CreatePaymentDto, traceId: string): Promise<IPaymentResult> {
    const { orderId, amount, currency, method } = dto;

    this.logger.log(`[TraceId: ${traceId}] Processing payment via ${method} for order ${orderId}`);

    // --- Validaciones comunes ---
    if (!orderId || !amount || amount <= 0) {
      throw new CustomException({
        statusCode: 400,
        message: 'Missing or invalid payment fields',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
        meta: { orderId, amount },
      });
    }

    if (!Object.values(PaymentMethod).includes(method)) {
      throw new CustomException({
        statusCode: 400,
        message: `Unsupported payment method: ${method}`,
        code: ResponseCodes.INVALID_PAYMENT_METHOD,
        traceId,
      });
    }

    const order = await firstValueFrom(this.ordersClient.send('orders.findOne', { id: orderId, traceId, serviceSecret: process.env.SERVICE_SECRET }).pipe(
      timeout(8000),
      retry(2),
    ));

    if (!order) {
      throw new CustomException({
        statusCode: 404,
        message: 'Order not found',
        code: ResponseCodes.ORDER_NOT_FOUND,
        traceId,
        meta: { orderId },
      });
    }

    if (order.totalAmount !== amount) {
      throw new CustomException({
        statusCode: 400,
        message: 'Payment amount does not match order',
        code: ResponseCodes.PAYMENT_AMOUNT_MISMATCH,
        traceId,
        meta: { orderId, orderAmount: order.totalAmount, paymentAmount: amount },
      });
    }

    const customerId = String(order.customerId ?? '');
    const providerId = String(order.providerId ?? '');

    if (!customerId || !providerId) {
      throw new CustomException({
        statusCode: 400,
        message: 'Order missing customer or provider information',
        code: ResponseCodes.ORDER_DATA_INCOMPLETE,
        traceId,
        meta: { orderId, customerId, providerId },
      });
    }

    const customer = await firstValueFrom(this.customersClient.send('customers.findOne', { id: customerId, traceId, serviceSecret: process.env.SERVICE_SECRET }).pipe(
      timeout(8000),
      retry(1),
    ));

    // Verifica order status
    if (order.status !== 'PENDING') {
      throw new CustomException({
        statusCode: 400,
        message: `Order status is ${order.status}, cannot process payment`,
        code: ResponseCodes.INVALID_ORDER_STATE,
        traceId,
        meta: { orderId, orderStatus: order.status },
      });
    }

    // Verifica pagos previos (no crea nuevos si ya hay uno exitoso) 
    const existing = await this.paymentModel.findOne({ orderId, method }).exec();
    if (existing && existing.status !== 'FAILED' && existing.status !== 'CANCELLED') {
      throw new CustomException({
        statusCode: 409,
        message: `Payment already exists for order ${orderId} using method ${method}`,
        code: ResponseCodes.PAYMENT_ALREADY_PROCESSED,
        traceId,
        meta: { existingId: existing._id },
      });
    }

    // --- Selecciona el processor ---
    const processor = this.processors[method];
    if (!processor) {
      throw new CustomException({
        statusCode: 400,
        message: `Payment processor not configured for ${method}`,
        code: ResponseCodes.SERVICE_CONFIGURATION_ERROR,
        traceId,
      });
    }

    // --- Crea el registro inicial en BD ---
    const paymentRecord = new this.paymentModel({
      orderId,
      customerId,
      providerId,
      amount,
      currency,
      method,
      status: PaymentStatus.PENDING,
    });

    await paymentRecord.save();

    try {
      // --- Procesa con el processor correspondiente ---
      const result = await processor.create(dto, traceId, { name: customer.name, email: customer.email });

      // --- Actualiza el registro ---
      paymentRecord.status = this.mapExternalStatus(result.status);
      paymentRecord.externalStatus = result.status;
      paymentRecord.reference = result.id;
      paymentRecord.externalReference = result.raw?.id || null;
      await paymentRecord.save();

      // --- Logs y retorno ---
      this.logger.log(`[TraceId: ${traceId}] Payment processed successfully: ${paymentRecord._id}`);
      return result;
    } catch (err) {
      this.logger.error(`[TraceId: ${traceId}] Payment processing failed: ${err.message}`);
      paymentRecord.status = PaymentStatus.FAILED;
      await paymentRecord.save();

      throw new CustomException({
        statusCode: 502,
        message: 'Payment processing failed',
        code: ResponseCodes.PAYMENT_FAILED,
        traceId,
        meta: { error: err.message },
      });
    }
  }

  private mapExternalStatus(status: string): PaymentStatus {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'succeeded':
      case 'paid':
        return PaymentStatus.AUTHORIZED;
      case 'pending':
      case 'requires_payment_method':
      case 'processing':
        return PaymentStatus.PENDING;
      case 'failed':
      case 'canceled':
        return PaymentStatus.FAILED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Permite capturar o confirmar un pago (por ejemplo, Cash o Transfer).
   */
  async capturePayment(paymentId: string, traceId: string): Promise<IPaymentResult> {
    const payment = await this.paymentModel.findById(paymentId).exec();
    if (!payment) {
      throw new CustomException({
        statusCode: 404,
        message: 'Payment not found',
        code: ResponseCodes.PAYMENT_NOT_FOUND,
        traceId,
      });
    }

    const processor = this.processors[payment.method];
    if (!processor?.capture) {
      throw new CustomException({
        statusCode: 400,
        message: `Capture not supported for ${payment.method}`,
        code: ResponseCodes.INVALID_OPERATION,
        traceId,
      });
    }

    if (payment.reference == null) {
      throw new CustomException({
        statusCode: 400,
        message: `Payment reference is missing, cannot capture`,
        code: ResponseCodes.PAYMENT_DATA_INCOMPLETE,
        traceId,
      });
    }

    const result = await processor.capture(payment.reference, traceId);
    payment.status = this.mapExternalStatus(result.status);
    payment.externalStatus = result.status;
    await payment.save();

    this.logger.log(`[TraceId: ${traceId}] Payment ${paymentId} captured successfully`);
    return result;
  }

  /**
   * Procesa un reembolso (solo para métodos compatibles).
   */
  async refundPayment(paymentId: string, amount: number, traceId: string): Promise<IPaymentResult> {
    const payment = await this.paymentModel.findById(paymentId).exec();
    if (!payment) {
      throw new CustomException({
        statusCode: 404,
        message: 'Payment not found',
        code: ResponseCodes.PAYMENT_NOT_FOUND,
        traceId,
      });
    }

    const processor = this.processors[payment.method];
    if (!processor?.refund) {
      throw new CustomException({
        statusCode: 400,
        message: `Refund not supported for ${payment.method}`,
        code: ResponseCodes.INVALID_OPERATION,
        traceId,
      });
    }

    if (payment.reference == null) {
      throw new CustomException({
        statusCode: 400,
        message: `Payment reference is missing, cannot capture`,
        code: ResponseCodes.PAYMENT_DATA_INCOMPLETE,
        traceId,
      });
    }

    const result = await processor.refund(payment.reference, amount, traceId);
    payment.status = PaymentStatus.REFUNDED;
    payment.externalStatus = result.status;
    await payment.save();

    this.logger.log(`[TraceId: ${traceId}] Payment ${paymentId} refunded successfully`);
    return result;
  }
}