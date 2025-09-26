import { Injectable } from '@nestjs/common';

@Injectable()
export class PshService {
    constructor() { }

    async sendPushNotification(token: string, title: string, message: string, meta?: Record<string, any>): Promise<void> {
        // Aquí iría la lógica real para enviar una notificación push, por ahora solo simulamoslo
        console.log(`Enviando notificación push al token ${token} con título "${title}" y mensaje: ${message}\n${JSON.stringify(meta)}`);
    }
}