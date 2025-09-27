import { NotificationChannel } from "../enums/notification-channel.enum";
import { NotificationType } from "../enums/notification-type.enum"

const templates: Partial<Record<`${keyof typeof NotificationType}_${keyof typeof NotificationChannel}`, (payload: Record<string, any>) => string>> = {
    ORDER_REQUESTED_WHATSAPP: (p) => `🛒 Tienes una nueva orden *#${p.orderNumber}*. 

*Productos*: 
${(p.orderItems as { name: string; qty: number; unit: string }[]).reduce((p, c) => p + `\n- ${c.name}: ${c.qty} ${c.unit !== 'unit' ? c.unit : ''}`, '')}

*Metodo de pago*: ${p.paymentMethod}
*Referencia de pago*: ${p.paymentRef}
*Cliente*: ${p.userName}
*Tel*: ${p.userPhone}`,
}

export default templates;
