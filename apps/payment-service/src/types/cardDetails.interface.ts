export interface ICardDetails {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
    name?: string;
    billingDetails?: {
        email?: string;
        phone?: string;
        address?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postal_code?: string;
            country?: string;
        };
    };
}