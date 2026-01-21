import { CustomException } from '@colmapp/exceptions';
import { formatPhoneNumber } from '@colmapp/utils';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ResponseCodes } from 'libs/types/responseCodes';

@Injectable()
export class WhtService {
    private readonly logger = new Logger(WhtService.name);

    private readonly apiUrl = process.env.WHATSAPP_API_URL;
    private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    async sendWht(phone: string, title: string, message: string, meta?: Record<string, any>, traceId?: string) {
        const to = formatPhoneNumber(phone, '1');
        const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

        if (!this.apiUrl || !this.phoneNumberId || !this.accessToken) {
            this.logger.error('[sendWht] WhatsApp configuration is missing.');
            throw new CustomException({
                statusCode: 500,
                message: 'WhatsApp configuration is missing',
                code: ResponseCodes.SERVICE_UNAVAILABLE,
                traceId,
                meta: {}
            });
        }

        if (!to || to.length < 10 || !/^\d+$/.test(to)) {
            this.logger.warn(`[sendWht] Invalid phone number: ${phone}`);
            throw new CustomException({
                statusCode: 400,
                message: 'Invalid phone number',
                code: ResponseCodes.INVALID_INPUT,
                traceId,
                meta: { phone }
            });
        }

        if (!message || message.trim().length === 0) {
            throw new CustomException({
                statusCode: 400,
                message: 'Message content is required',
                code: ResponseCodes.REQUIRED_FIELD_MISSING,
                traceId,
                meta: {}
            });
        }

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

            if (meta) {
                const { lat, lng, userName, address } = meta;
                if ([lat, lng, userName, address].some((v) => v === undefined || v === null)) {
                    this.logger.warn('[sendWht] Incomplete location data provided');
                } else if (isNaN(lat) || isNaN(lng)) {
                    this.logger.warn('[sendWht] Invalid latitude or longitude');
                } else {
                    await this.sendLocation(phone, lat, lng, userName, address);
                }
            }

            return res.data;
        } catch (err) {
            const details = err.response?.data || err.message || 'Unknown error';
            this.logger.error(`[sendWht] Error sending message: ${JSON.stringify(details)}`);

            throw new CustomException({
                statusCode: 500,
                message: 'Failed to send WhatsApp message',
                code: ResponseCodes.SERVICE_UNAVAILABLE,
                traceId,
                meta: { details }
            });
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