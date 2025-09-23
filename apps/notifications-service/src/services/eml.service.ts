import { Injectable } from '@nestjs/common';

@Injectable()
export class EmlService {
    constructor() { }

    async sendEmail(email: string, subject: string, body: string): Promise<void> {
        // Aquí iría la lógica real para enviar un email, por ahora solo simulamoslo
        console.log(`Enviando email a ${email} con asunto "${subject}" y cuerpo: ${body}`);
    }
}