import { PaymentMethod } from "@colmapp/types";

export interface IPaymentResult {
    id: string;
    status: string;
    externalStatus?: string;
    message?: string;
    amount: number;
    currency: string;
    method?: PaymentMethod;
    provider: "stripe" | string;
    raw?: any;
}