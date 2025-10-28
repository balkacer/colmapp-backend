import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethod } from "@colmapp/types";
import { IPaymentProcessor } from "../types/paymentProcessor.interface";
import { IPaymentResult } from "../types/paymentResult.interface";
import { CreatePaymentDto } from "../dto/create-payment.dto";
import { PaymentStatus } from "../types/paymentStatus.enum";

@Injectable()
export class CashPaymentsProcessor implements IPaymentProcessor {
    readonly method = PaymentMethod.CASH;
    private readonly logger = new Logger(CashPaymentsProcessor.name);
    private storedPayments: Map<string, IPaymentResult> = new Map();
    constructor() { }

    /**
     * Crea un pago en efectivo.
     * Se marca como PENDING hasta que el repartidor o proveedor confirme el pago.
     */
    async create(dto: CreatePaymentDto, traceId?: string): Promise<IPaymentResult> {
        this.logger.log(`[TraceId: ${traceId}] Creating CASH payment for order ${dto.orderId}`);

        // Aquí normalmente se insertaría un registro en BD
        const result: IPaymentResult = {
            id: `CASH-${Date.now()}`,
            status: PaymentStatus.PENDING,
            method: this.method,
            amount: dto.amount,
            currency: dto.currency,
            provider: "cash",
            externalStatus: "awaiting_confirmation",
            message: "Payment pending confirmation by provider",
            raw: {
                createdAt: new Date().toISOString(),
                orderId: dto.orderId,
            },
        };

        this.storedPayments.set(result.id, result);

        this.logger.log(`[TraceId: ${traceId}] Cash payment created: ${result.id}`);
        return result;
    }

    /**
     * Simula la confirmación (captura) del pago en efectivo.
     * Esto se haría cuando el proveedor confirme que recibió el dinero.
     */
    async capture(paymentId: string, traceId?: string): Promise<IPaymentResult> {
        this.logger.log(`[TraceId: ${traceId}] Capturing CASH payment ${paymentId}`);

        const payment = this.storedPayments.get(paymentId);

        if (!payment) {
            throw new Error(`Payment with ID ${paymentId} not found`);
        }

        // Actualizar el estado del pago a CAPTURED
        // En un caso real, se actualizaría el registro en BD 

        payment.status = PaymentStatus.CAPTURED;
        payment.externalStatus = "confirmed";
        payment.message = "Payment confirmed by provider";
        payment.raw = {
            ...payment.raw,
            confirmedAt: new Date().toISOString(),
        };

        this.storedPayments.set(paymentId, payment);

        this.logger.log(`[TraceId: ${traceId}] Cash payment ${paymentId} marked as SUCCESS`);
        return payment;
    }

    /**
     * Obtiene información del pago (simulado).
     */
    async get(paymentId: string, traceId?: string): Promise<IPaymentResult> {
        this.logger.log(`[TraceId: ${traceId}] Fetching CASH payment ${paymentId}`);

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
}