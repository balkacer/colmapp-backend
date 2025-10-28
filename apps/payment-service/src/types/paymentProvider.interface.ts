import { ICardDetails } from "./cardDetails.interface";
import { Currency } from "./currency.type";
import { IPaymentResult } from "./paymentResult.interface";

export interface IPaymentProvider {
    createPayment(
        amount: number,
        currency: Currency,
        paymentMethodId: string,
        metadata?: Record<string, string>
    ): Promise<IPaymentResult>;

    capturePayment(paymentId: string): Promise<IPaymentResult>;

    refundPayment(paymentId: string, amount?: number): Promise<IPaymentResult>;

    getPayment(paymentId: string): Promise<IPaymentResult>;
}