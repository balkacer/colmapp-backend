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
  async handleOrderCreated(@Payload() payload: { orderId: string; userId: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderCreated event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_CREATED,
      message: `Tu orden ${payload.orderId} ha sido creada exitosamente.`,
      channel: NotificationChannel.PUSH,
      meta: {
        orderId: payload.orderId,
      }
    });
  }

  @EventPattern('notifications.orderRequested')
  async handleOrderRequested(@Payload() payload: { orderId: string; userId: string; traceId?: string}) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderRequested event for orderId: ${payload.orderId}`)

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_REQUESTED,
      message: `Has recibido una nueva orden: ${payload.orderId}.`,
      channel: NotificationChannel.PUSH,
      meta: {
        orderId: payload.orderId,
      }
    });
  }

  @EventPattern('notifications.orderPaid')
  async handleOrderPaid(@Payload() payload: { orderId: string; userId: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderPaid event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_PAID,
      message: `Tu orden ${payload.orderId} fue pagada con éxito 🎉`,
      channel: NotificationChannel.PUSH,
      meta: { orderId: payload.orderId }
    });
  }

  @EventPattern('notifications.orderAccepted')
  async handleOrderAccepted(@Payload() payload: { orderId: string; userId: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderAccepted event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_ACCEPTED,
      message: `Tu orden ${payload.orderId} ha sido aceptada y está siendo procesada.`,
      channel: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      meta: { orderId: payload.orderId }
    });
  }

  @EventPattern('notifications.orderRejected')
  async handleOrderRejected(@Payload() payload: { orderId: string; userId: string; reason: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderRejected event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_REJECTED,
      message: `Lamentamos informarte que tu orden ${payload.orderId} fue rechazada. Razón: ${payload.reason}.`,
      channel: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      meta: { orderId: payload.orderId, reason: payload.reason }
    });
  }

  @EventPattern('notifications.orderCancelled')
  async handleOrderCancelled(@Payload() payload: { orderId: string; userId: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderCancelled event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_CANCELLED,
      message: `Tu orden ${payload.orderId} ha sido cancelada.`,
      channel: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      meta: { orderId: payload.orderId }
    });
  }

  @EventPattern('notifications.orderDelivered')
  async handleOrderDelivered(@Payload() payload: { orderId: string; userId: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderDelivered event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_DELIVERED,
      message: `Tu orden ${payload.orderId} ha sido entregada. ¡Disfruta tu compra!`,
      channel: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      meta: { orderId: payload.orderId }
    });
  }

  @EventPattern('notifications.orderAssigned')
  async handleOrderAssigned(@Payload() payload: { orderId: string; userId: string; deliveryPerson: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling orderAssigned event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.ORDER_ASSIGNED,
      message: `Tu orden ${payload.orderId} ha sido asignada a ${payload.deliveryPerson}.`,
      channel: NotificationChannel.PUSH,
      meta: { orderId: payload.orderId, deliveryPerson: payload.deliveryPerson }
    });
  }

  @EventPattern('notifications.productLowStock')
  async handleProductLowStock(@Payload() payload: { productId: string; userId: string; stock: number; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling productLowStock event for productId: ${payload.productId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PRODUCT_LOW_STOCK,
      message: `El producto ${payload.productId} está bajo de stock (quedan ${payload.stock} unidades).`,
      channel: NotificationChannel.WHATSAPP,
      meta: { productId: payload.productId, stock: payload.stock }
    });
  }

  @EventPattern('notifications.productOutOfStock')
  async handleProductOutOfStock(@Payload() payload: { productId: string; userId: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling productOutOfStock event for productId: ${payload.productId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PRODUCT_OUT_OF_STOCK,
      message: `El producto ${payload.productId} está agotado.`,
      channel: NotificationChannel.WHATSAPP,
      meta: { productId: payload.productId }
    });
  }

  @EventPattern('notifications.paymentFailed')
  async handlePaymentFailed(@Payload() payload: { orderId: string; userId: string; reason: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling paymentFailed event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PAYMENT_FAILED,
      message: `El pago de tu orden ${payload.orderId} falló. Razón: ${payload.reason}. Por favor, intenta nuevamente.`,
      channel: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      meta: { orderId: payload.orderId, reason: payload.reason }
    });
  }

  @EventPattern('notifications.refundIssued')
  async handleRefundIssued(@Payload() payload: { orderId: string; userId: string; amount: number; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling refundIssued event for orderId: ${payload.orderId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.REFUND_ISSUED,
      message: `Se ha emitido un reembolso de $${payload.amount} para tu orden ${payload.orderId}.`,
      channel: NotificationChannel.EMAIL,
      meta: { orderId: payload.orderId, amount: payload.amount }
    });
  }

  @EventPattern('notifications.welcomeUser')
  async handleWelcomeUser(@Payload() payload: { userId: string; userName: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling welcomeUser event for userId: ${payload.userId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.WELCOME_USER,
      message: `¡Bienvenido a Colmapp, ${payload.userName}! Estamos encantados de tenerte con nosotros.`,
      channel: NotificationChannel.EMAIL,
      meta: { userName: payload.userName }
    });
  }

  @EventPattern('notifications.profileUpdated')
  async handleProfileUpdated(@Payload() payload: { userId: string; userName: string; traceId?: string }) {
    const { traceId } = payload;
    this.logger.log(`[TraceId: ${traceId}] Handling profileUpdated event for userId: ${payload.userId}`);

    await this.notificationsService.sendNotification({
      userId: payload.userId,
      type: NotificationType.PROFILE_UPDATED,
      message: `Hola ${payload.userName}, tu perfil ha sido actualizado exitosamente.`,
      channel: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
      meta: { userName: payload.userName }
    });
  }
}