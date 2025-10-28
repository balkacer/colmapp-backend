import Stripe from "stripe";
import { ICardDetails } from "../types/cardDetails.interface";
import { Currency } from "../types/currency.type";
import { IPaymentProvider } from "../types/paymentProvider.interface";
import { IPaymentResult } from "../types/paymentResult.interface";
import { CustomException } from "@colmapp/exceptions";
import { ResponseCodes } from "libs/types/responseCodes";
import { trace } from "console";
import { Logger } from "@nestjs/common";

/**
 * Stripe-based PaymentProvider implementation.
 * Requires STRIPE_API_KEY in env to be present when instantiated.
 */
export default class StripePaymentProvider implements IPaymentProvider {
    private stripe: Stripe;
    private logger = new Logger(StripePaymentProvider.name);

    constructor(apiKey: string) {
        this.stripe = new Stripe(apiKey, { apiVersion: "2025-09-30.clover" });
    }

    async createPayment(
        amount: number,
        currency: Currency,
        paymentMethodId: string,
        metadata: Record<string, string> = {},
        traceId?: string
    ): Promise<IPaymentResult> {
        try {
            const customer = await this.getStripeCustomerId({ email: metadata['customer_email'] || 'unknown' }, traceId);

            const pi = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // convertir a centavos,
                currency,
                payment_method: paymentMethodId,
                customer, 
                confirm: true,
                payment_method_types: ['card'],
                metadata,
            });

            return {
                id: pi.id,
                status: pi.status,
                amount: (pi.amount as number) || amount,
                currency: pi.currency || currency,
                provider: "stripe",
                raw: pi,
            };

        } catch (error: any) {
            if (error.code === 'payment_method_unexpected_state') {
                throw new CustomException({
                    statusCode: 400,
                    message: 'This card has already been used. Please enter a new card.',
                    code: ResponseCodes.PAYMENT_METHOD_ALREADY_USED,
                    traceId,
                    meta: error,
                });
            }
            throw new CustomException({
                message: error.message || "Stripe payment failed",
                code: error.code || ResponseCodes.CARD_PROVIDER_ERROR,
                statusCode: 502,
                traceId,
                meta: error,
            });
        }
    }

    async capturePayment(paymentId: string, traceId?: string): Promise<IPaymentResult> {
        try {
            const pi = await this.stripe.paymentIntents.capture(paymentId);
            return {
                id: pi.id,
                status: pi.status,
                amount: (pi.amount as number) || 0,
                currency: pi.currency || "usd",
                provider: "stripe",
                raw: pi,
            };
        } catch (error: any) {
            throw new CustomException({
                message: error.message || "Stripe capture failed",
                code: error.code || ResponseCodes.CARD_PROVIDER_ERROR,
                statusCode: 502,
                meta: error,
                traceId,
            });
        }
    }

    async refundPayment(paymentId: string, amount?: number, traceId?: string): Promise<IPaymentResult> {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentId,
                amount,
            });

            return {
                id: refund.id,
                status: refund.status!,
                amount: (refund.amount as number) || 0,
                currency: refund.currency || "usd",
                provider: "stripe",
                raw: refund,
            };
        } catch (error: any) {
            throw new CustomException({
                message: error.message || "Stripe refund failed",
                code: error.code || ResponseCodes.CARD_PROVIDER_ERROR,
                statusCode: 502,
                meta: error,
                traceId,
            });
        }
    }

    async getPayment(paymentId: string, traceId?: string): Promise<IPaymentResult> {
        try {
            const pi = await this.stripe.paymentIntents.retrieve(paymentId);
            return {
                id: pi.id,
                status: pi.status,
                amount: (pi.amount as number) || 0,
                currency: pi.currency || "usd",
                provider: "stripe",
                raw: pi,
            };
        } catch (error: any) {
            throw new CustomException({
                message: error.message || "Stripe retrieve payment failed",
                code: error.code || ResponseCodes.CARD_PROVIDER_ERROR,
                statusCode: 502,
                meta: error,
                traceId,
            });
        }
    }

    private async getStripeCustomerId(dto: { name?: string; email: string }, traceId?: string): Promise<string> {
        const existingCustomers = await this.stripe.customers.list({
            email: dto.email,
            limit: 1,
        });

        let customerId: string;

        if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0].id;
            this.logger.log(`Customer already exists: ${customerId}`);
        } else {
            const newCustomer = await this.stripe.customers.create({
                email: dto.email,
                name: dto.name,
            });
            customerId = newCustomer.id;
            this.logger.log(`New customer created: ${customerId}`);
        }

        return customerId;
    }
}
