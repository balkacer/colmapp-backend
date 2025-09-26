import { Injectable } from '@nestjs/common';

@Injectable()
export class WhtService {
    constructor() { }

    async sendWht(phone: string, title: string, message: string): Promise<void> {
        // Simulate sending WhatsApp message
        console.log(`Sending WhatsApp message to ${phone}: ${title}\n\n${message}`);
    }
}