import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
    constructor() { }

    async sendSms(phone: string, title: string, message: string): Promise<void> {
        // Simulate sending SMS
        console.log(`Sending SMS to ${phone}: ${title}\n\n${message}`);
    }
}
