import { PaymentMethod } from "@colmapp/types";
import { Currency } from "./currency.type";
import { IsoDateString } from "./isoDateString.type";
import { PaymentStatus } from "./paymentStatus.enum";

export type Payment = {
    id: string;
    amount: number; // smallest currency unit (e.g. cents)
    currency: Currency;
    status: PaymentStatus;
    createdAt: IsoDateString;
    updatedAt?: IsoDateString;
    metadata?: Record<string, unknown>;
    method?: PaymentMethod;
    merchantReference?: string;
    capturedAmount?: number;
    refundedAmount?: number;
    rawResponse?: unknown; // provider response object for debugging/audit
}