import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmlService, PshService, SmsService, WhtService } from './services';
import { ClientProxy } from '@nestjs/microservices';
import { timeout, retry, lastValueFrom } from 'rxjs';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationChannel } from './enums/notification-channel.enum';
import templates from './templates';
import { CustomException } from '@colmapp/exceptions';
import { ResposeCodes } from '@colmapp/types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private emlService: EmlService,
    private smsService: SmsService,
    private pshService: PshService,
    private whtService: WhtService,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) { }

  async sendNotification(payload: {
    userId: string;
    type: NotificationType;
    message: string;
    channels: NotificationChannel | NotificationChannel[];
    traceId: string;
    meta?: Record<string, any>
  }) {
    const { userId, type, message, channels, meta, traceId } = payload;

    if (!userId) {
      throw new CustomException({
        statusCode: 400,
        message: 'userId is required',
        code: ResposeCodes.INVALID_INPUT,
        traceId,
      });
    }

    if (!type) {
      throw new CustomException({
        statusCode: 400,
        message: 'Notification type is required',
        code: ResposeCodes.INVALID_INPUT,
        traceId,
      });
    }

    if (!Object.values(NotificationType).includes(type)) {
      throw new CustomException({
        statusCode: 400,
        message: `Invalid notification type: ${type}`,
        code: ResposeCodes.INVALID_INPUT,
        traceId,
      });
    }

    if (!channels) {
      throw new CustomException({
        statusCode: 400,
        message: 'Notification channel(s) is required',
        code: ResposeCodes.INVALID_INPUT,
        traceId,
      });
    }

    const _channels = [channels].flat();

    for (const channel of _channels) {
      if (!Object.values(NotificationChannel).includes(channel)) {
        throw new CustomException({
          statusCode: 400,
          message: `Invalid notification channel: ${channel}`,
          code: ResposeCodes.INVALID_INPUT,
          traceId,
        });
      }
    }

    this.logger.log(`Preparing to send ${type} notification via ${_channels.reduce(
      (p, c, i, { length }) => p + `${i > 0 && i !== length - 1 ? ', ' : i === length - 1 && i > 0 ? ' and ' : ''}${c}`, ''
    )} to user ${userId}`);

    const userContact = await this.getUserContact(userId, traceId);
    const title = this.getTitleByType(type);

    // Check if templates exist for at least one channel or message provided
    const hasValidTemplateOrMessage = _channels.some(channel => {
      return templates[`${type}_${channel}` as keyof typeof templates]?.(meta || {}) || message;
    });

    if (!hasValidTemplateOrMessage) {
      throw new CustomException({
        statusCode: 400,
        message: `No template or message provided for notification type ${type} and channels ${_channels.join(', ')}`,
        code: ResposeCodes.INVALID_INPUT,
        traceId,
      });
    }

    const _messages = _channels.reduce<Record<keyof typeof NotificationChannel, string>>(
      (prev, channel) => ({ ...prev, [channel]: templates[`${type}_${channel}` as keyof typeof templates]?.(meta || {}) || message }), {} as Record<keyof typeof NotificationChannel, string>);

    const results = await this.dispatchNotification(userId, _channels, userContact, title, _messages, { ...meta, traceId });

    return {
      success: results.every(r => r.success),
      results,
      traceId,
      timestamp: new Date().toISOString(),
    };
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
      case NotificationType.ORDER_SHIPPED:
        return 'Orden en Camino';
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
    channels: NotificationChannel[],
    userContact: { email?: string; phone?: string; pushToken?: string },
    title: string,
    messages: Record<keyof typeof NotificationChannel, string>,
    meta?: Record<string, any>
  ): Promise<{ channel: NotificationChannel; success: boolean; error?: any }[]> {
    const results: { channel: NotificationChannel; success: boolean; error?: any }[] = [];
    for (const channel of channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            if (userContact.email) {
              await this.emlService.sendEmail(userContact.email, title, messages[NotificationChannel.EMAIL]);
              this.logger.log(`Email sent to ${userContact.email}`, meta?.traceId);
              results.push({ channel, success: true });
            } else {
              throw new CustomException({
                statusCode: 400,
                message: `No email found for user ${userId}`,
                code: ResposeCodes.EMAIL_NOT_FOUND,
                traceId: meta?.traceId,
                meta: { userId }
              });
            }
            break;

          case NotificationChannel.SMS:
            if (userContact.phone) {
              await this.smsService.sendSms(userContact.phone, title, messages[NotificationChannel.SMS]);
              this.logger.log(`SMS sent to ${userContact.phone}`, meta?.traceId);
              results.push({ channel, success: true });
            } else {
              throw new CustomException({
                statusCode: 400,
                message: `No phone number found for user ${userId}`,
                code: ResposeCodes.SMS_NOT_VERIFIED,
                traceId: meta?.traceId,
                meta: { userId }
              });
            }
            break;

          case NotificationChannel.PUSH_TOKEN:
            if (userContact.pushToken) {
              await this.pshService.sendPushNotification(userContact.pushToken, title, messages[NotificationChannel.PUSH_TOKEN], meta);
              this.logger.log(`Push notification sent to user ${userId}`, meta?.traceId);
              results.push({ channel, success: true });
            } else {
              throw new CustomException({
                statusCode: 400,
                message: `No push token found for user ${userId}`,
                code: ResposeCodes.PUSH_NOT_VERIFIED,
                traceId: meta?.traceId,
                meta: { userId }
              });
            }
            break;

          case NotificationChannel.WHATSAPP:
            if (userContact.phone) {
              await this.whtService.sendWht(userContact.phone, title, messages[NotificationChannel.WHATSAPP], meta, meta?.traceId);
              this.logger.log(`WhatsApp message sent to ${userContact.phone}`, meta?.traceId);
              results.push({ channel, success: true });
            } else {
              throw new CustomException({
                statusCode: 400,
                message: `No phone number found for user ${userId}`,
                code: ResposeCodes.SMS_NOT_VERIFIED,
                traceId: meta?.traceId,
                meta: { userId }
              });
            }
            break;

          default:
            throw new CustomException({
              statusCode: 400,
              message: `Unsupported notification channel: ${channel}`,
              code: ResposeCodes.UNSUPPORTED_NOTIFICATION_CHANNEL,
              traceId: meta?.traceId,
              meta: { userId, channel }
            });
        }
      } catch (err) {
        this.logger.error(`Failed to send via ${channel} to user ${userId} traceId: ${meta?.traceId} error: ${err.message}`, err.stack);
        results.push({ channel, success: false, error: { message: err.message, stack: err.stack, code: err.code || null } });
      }
    }

    return results;
  }

  private async getUserContact(userId: string, traceId: string): Promise<{ email?: string; phone?: string; pushToken?: string }> {
    this.logger.log(`Fetching contact details for user ${userId}`);
    try {
      const userContact = await lastValueFrom(this.usersClient.send('users.getUserContact', {
        userId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET,
      }).pipe(
        timeout(8000),
        retry(1),
      ));

      if (!userContact || (!userContact.email && !userContact.phone && !userContact.pushToken)) {
        throw new CustomException({
          statusCode: 404,
          message: `No contact details found for user ${userId}`,
          code: ResposeCodes.USER_NOT_FOUND,
          traceId,
          meta: { userId }
        });
      }

      return userContact;
    } catch (error) {
      this.logger.error(`Error fetching contact details for user ${userId} traceId: ${traceId} error: ${error.message}`, error.stack);
      throw new CustomException({
        statusCode: 500,
        message: `Failed to fetch contact details for user ${userId}`,
        code: ResposeCodes.USER_NOT_FOUND,
        traceId,
        meta: { userId, originalError: error.message }
      });
    }
  }
}
