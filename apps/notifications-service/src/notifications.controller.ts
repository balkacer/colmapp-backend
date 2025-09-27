import { Controller, Logger, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationChannel } from './enums/notification-channel.enum';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) { }

  @EventPattern('notifications.orderCreated')
  async handleOrderCreated(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderCreated event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_CREATED,
      message: `Tu orden ${payload.orderNumber} ha sido creada exitosamente.`,
      channels: NotificationChannel.WHATSAPP,
      meta,
      traceId,
    });
  }

  @EventPattern('notifications.orderRequested')
  async handleOrderRequested(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderRequested event for orderNumber: ${payload.orderNumber}`)

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_REQUESTED,
      message: `Has recibido una nueva orden: ${payload.orderNumber}.`,
      channels: NotificationChannel.WHATSAPP,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.orderPaid')
  async handleOrderPaid(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderPaid event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_PAID,
      message: `Tu orden ${payload.orderNumber} fue pagada con éxito 🎉`,
      channels: NotificationChannel.PUSH_TOKEN,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.orderAccepted')
  async handleOrderAccepted(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderAccepted event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_ACCEPTED,
      message: `Tu orden ${payload.orderNumber} ha sido aceptada y está siendo procesada.`,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH_TOKEN],
      meta,
      traceId
    });
  }

  @EventPattern('notifications.orderRejected')
  async handleOrderRejected(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; reason: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderRejected event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_REJECTED,
      message: `Lamentamos informarte que tu orden ${payload.orderNumber} fue rechazada. Razón: ${payload.reason}.`,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH_TOKEN],
      meta,
      traceId
    });
  }

  @EventPattern('notifications.orderCancelled')
  async handleOrderCancelled(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderCancelled event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_CANCELLED,
      message: `Tu orden ${payload.orderNumber} ha sido cancelada.`,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH_TOKEN],
      meta,
      traceId
    });
  }

  @EventPattern('notifications.orderCancelledByCustomer')
  async handleOrderCancelledByCustomer(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderCancelledByCustomer event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_CANCELLED_BY_CUSTOMER,
      message: `El cliente a cancelado la orden ${payload.orderNumber}`,
      channels: NotificationChannel.WHATSAPP,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.orderDelivered')
  async handleOrderDelivered(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderDelivered event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_DELIVERED,
      message: `Tu orden ${payload.orderNumber} ha sido entregada. ¡Disfruta tu compra!`,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH_TOKEN],
      meta,
      traceId
    });
  }

  @EventPattern('notifications.orderShipped')
  async handleOrderShipped(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderShipped event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_SHIPPED,
      message: `Tu orden ${payload.orderNumber} ya va en camino!`,
      channels: NotificationChannel.PUSH_TOKEN,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.productLowStock')
  async handleProductLowStock(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; productId: string; userId: string; stock: number; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling productLowStock event for productId: ${payload.productId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PRODUCT_LOW_STOCK,
      message: `El producto ${payload.productId} está bajo de stock (quedan ${payload.stock} unidades).`,
      channels: NotificationChannel.WHATSAPP,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.productOutOfStock')
  async handleProductOutOfStock(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; productId: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling productOutOfStock event for productId: ${payload.productId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PRODUCT_OUT_OF_STOCK,
      message: `El producto ${payload.productId} está agotado.`,
      channels: NotificationChannel.WHATSAPP,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.paymentFailed')
  async handlePaymentFailed(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling paymentFailed event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PAYMENT_FAILED,
      message: `El pago de tu orden ${payload.orderNumber} falló. Por favor, intenta nuevamente.`,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH_TOKEN],
      meta,
      traceId
    });
  }

  @EventPattern('notifications.refundIssued')
  async handleRefundIssued(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; orderNumber: string; userId: string; amount: number; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling refundIssued event for orderNumber: ${payload.orderNumber}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.REFUND_ISSUED,
      message: `Se ha emitido un reembolso de $${payload.amount} para tu orden ${payload.orderNumber}.`,
      channels: NotificationChannel.EMAIL,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.welcomeUser')
  async handleWelcomeUser(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; userId: string; userName: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling welcomeUser event for userId: ${payload.userId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.WELCOME_USER,
      message: `¡Bienvenido a Colmapp, ${payload.userName}! Estamos encantados de tenerte con nosotros.`,
      channels: NotificationChannel.EMAIL,
      meta,
      traceId
    });
  }

  @EventPattern('notifications.profileUpdated')
  async handleProfileUpdated(@Payload() payload: { meta?: Record<string, any>; serviceSecret: string; userId: string; userName: string; traceId: string }) {
    const { traceId, meta } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling profileUpdated event for userId: ${payload.userId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PROFILE_UPDATED,
      message: `Hola ${payload.userName}, tu perfil ha sido actualizado exitosamente.`,
      channels: [NotificationChannel.PUSH_TOKEN, NotificationChannel.EMAIL],
      meta,
      traceId
    });
  }
}