import { formatPhoneNumber } from '@colmapp/utils';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhtService {
    private readonly logger = new Logger(WhtService.name);

    private readonly apiUrl = process.env.WHATSAPP_API_URL;
    private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    async sendWht(phone: string, title: string, message: string) {
        const to = formatPhoneNumber(phone, '1');
        const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

        try {
            const res = await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: "individual",
                    to,
                    type: 'text',
                    text: { preview_url: false, body: `${title}\n${message}` },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            this.logger.log(`[WhatsApp API] Sent message to ${to}: ${title} | ${message}`);
            this.logger.log(`[WhatsApp API] Response: \n\n ${JSON.stringify(res.data)}`);
            return res.data;
        } catch (err) {
            this.logger.error(`[WhatsApp API] Error sending message: ${JSON.stringify(err)}`);
            throw err;
        }
    }
}