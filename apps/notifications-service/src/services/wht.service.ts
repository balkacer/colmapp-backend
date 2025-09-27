import { formatPhoneNumber } from '@colmapp/utils';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhtService {
    private readonly logger = new Logger(WhtService.name);

    private readonly apiUrl = process.env.WHATSAPP_API_URL;
    private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    async sendWht(phone: string, title: string, message: string, meta?: Record<string, any>) {
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
                    text: { preview_url: false, body: `${message}` },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            this.logger.log(`[sendWht] Sent message to ${to}: "${title}"`);
            this.logger.log(`[sendWht] Response: ${JSON.stringify(res.data)}`);

            if (meta && meta['lat'] && meta['lng'] && meta['userName'] && meta['address']) {
                this.sendLocation(phone, meta['lat'], meta['lng'], meta['userName'], meta['address'])
            }

            return res.data;
        } catch (err) {
            this.logger.error(`[sendWht] Error sending message: ${JSON.stringify(err)}`);
            throw err;
        }
    }

    async sendLocation(phone: string, latitude: number, longitude: number, name: string, address: string) {
        const to = formatPhoneNumber(phone, '1');
        const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

        try {
            const res = await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'location',
                    location: {
                        latitude,
                        longitude,
                        name,
                        address,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            this.logger.log(`[sendLocation] Sent location to ${phone}: ${name} (${latitude}, ${longitude})`);
            this.logger.log(`[sendLocation] Response: ${JSON.stringify(res.data)}`);
            return res.data;
        } catch (err) {
            this.logger.error(`[sendLocation] Error sending location: ${err.response?.data || err.message}`);
            throw err;
        }
    }
}