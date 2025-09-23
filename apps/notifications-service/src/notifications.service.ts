import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmlService, PshService, SmsService, WhtService } from './services';
import { ClientProxy } from '@nestjs/microservices';
import { timeout, retry, lastValueFrom } from 'rxjs';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationChannel } from './enums/notification-channel.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private emlService: EmlService,
    private smsService: SmsService,
    private pshService: PshService,
    private whtService: WhtService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) { }

  async sendNotification(payload: { userId: string; type: NotificationType, message: string; channel: NotificationChannel | NotificationChannel[], meta?: Record<string, any> }) {
    const { userId, type, message, channel, meta } = payload;

    this.logger.log(`Preparing to send ${type} notification via ${channel} to user ${userId}`);

    const userContact = await this.getUserContact(userId);
    const title = this.getTitleByType(type);

    await this.dispatchNotification(userId, channel, userContact, title, message, meta);
  }

  private getTitleByType(type: NotificationType): string {
    switch (type) {
      case NotificationType.ORDER_CREATED:
        return 'Orden Creada';
      case NotificationType.ORDER_REQUESTED:
        return 'Nueva Orden';
      case NotificationType.ORDER_PAID:
        return 'Orden Pagada';
      case NotificationType.ORDER_ACCEPTED:
        return 'Orden Aceptada';
      case NotificationType.ORDER_REJECTED:
        return 'Orden Rechazada';
      case NotificationType.ORDER_CANCELLED:
        return 'Orden Cancelada';
      case NotificationType.ORDER_DELIVERED:
        return 'Orden Entregada';
      case NotificationType.ORDER_ASSIGNED:
        return 'Orden Asignada';
      case NotificationType.PRODUCT_LOW_STOCK:
        return 'Producto con Bajo Stock';
      case NotificationType.PRODUCT_OUT_OF_STOCK:
        return 'Producto Sin Stock';
      case NotificationType.PAYMENT_FAILED:
        return 'Pago Fallido';
      case NotificationType.REFUND_ISSUED:
        return 'Reembolso Emitido';
      case NotificationType.WELCOME_USER:
        return 'Bienvenido';
      case NotificationType.PROFILE_UPDATED:
        return 'Perfil Actualizado';
      default:
        return 'Notificación';
    }
  }

  private async dispatchNotification(
    userId: string,
    channels: NotificationChannel | NotificationChannel[],
    userContact: { email?: string; phone?: string; pushToken?: string },
    title: string,
    message: string,
    meta?: Record<string, any>
  ): Promise<{ channel: NotificationChannel; success: boolean; error?: string }[]> {
    const results: { channel: NotificationChannel; success: boolean; error?: string }[] = [];

    const channelList = Array.isArray(channels) ? channels : [channels];

    for (const channel of channelList) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            if (userContact.email) {
              await this.emlService.sendEmail(userContact.email, title, message);
              this.logger.log(`Email sent to ${userContact.email}`);
              results.push({ channel, success: true });
            } else {
              throw new Error(`No email found for user ${userId}`);
            }
            break;

          case NotificationChannel.SMS:
            if (userContact.phone) {
              await this.smsService.sendSms(userContact.phone, title, message);
              this.logger.log(`SMS sent to ${userContact.phone}`);
              results.push({ channel, success: true });
            } else {
              throw new Error(`No phone number found for user ${userId}`);
            }
            break;

          case NotificationChannel.PUSH:
            if (userContact.pushToken) {
              await this.pshService.sendPushNotification(userContact.pushToken, title, message, meta);
              this.logger.log(`Push notification sent to user ${userId}`);
              results.push({ channel, success: true });
            } else {
              throw new Error(`No push token found for user ${userId}`);
            }
            break;

          case NotificationChannel.WHATSAPP:
            if (userContact.phone) {
              await this.whtService.sendWht(userContact.phone, title, message);
              this.logger.log(`WhatsApp message sent to ${userContact.phone}`);
              results.push({ channel, success: true });
            } else {
              throw new Error(`No phone number found for user ${userId}`);
            }
            break;

          default:
            throw new Error(`Unsupported notification channel: ${channel}`);
        }
      } catch (err) {
        this.logger.error(`Failed to send via ${channel} to user ${userId}: ${err.message}`);
        results.push({ channel, success: false, error: err.message });
      }
    }

    return results;
  }

  async getUserContact(userId: string): Promise<{ email?: string; phone?: string; pushToken?: string }> {
    this.logger.log(`Fetching contact details for user ${userId}`);
    return lastValueFrom(this.authClient.send('auth.getUserContact', {
      userId,
      serviceSecret: process.env.SERVICE_SECRET,
    }).pipe(
      timeout(10000),
      retry(3),
    ))
  }
}
