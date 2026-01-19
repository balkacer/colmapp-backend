import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { generateOrderNumber } from '@colmapp/utils';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @Inject('CUSTOMERS_SERVICE') private readonly customersClient: ClientProxy,
    @Inject('PROVIDERS_SERVICE') private readonly providersClient: ClientProxy,
    @Inject('PRODUCTS_SERVICE') private readonly productsClient: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
  ) { }

  async create(createOrderDto: CreateOrderDto, traceId: string): Promise<Order> {
    // Validaciones básicas de campos requeridos
    if (
      !createOrderDto.customerId ||
      !createOrderDto.providerId ||
      !Array.isArray(createOrderDto.items) ||
      createOrderDto.items.length < 1
    ) {
      throw new CustomException({
        statusCode: 400,
        message: 'customerId, providerId y items son requeridos y deben ser válidos',
        code: ResponseCodes.INVALID_INPUT,
        traceId,
      });
    }
    if (createOrderDto.customerId === createOrderDto.providerId) {
      throw new CustomException({
        statusCode: 400,
        message: 'customerId y providerId no pueden ser iguales',
        code: ResponseCodes.INVALID_INPUT,
        traceId,
      });
    }

    // Validación de items
    for (const item of createOrderDto.items) {
      if (
        !item.productId ||
        typeof item.quantity !== 'number' || item.quantity <= 0 ||
        typeof item.price !== 'number' || item.price <= 0
      ) {
        throw new CustomException({
          statusCode: 400,
          message: 'Cada item debe tener productId, quantity > 0 y price > 0',
          code: ResponseCodes.BAD_REQUEST,
          traceId,
        });
      }
    }

    // Obtener customer
    let customer: any;
    try {
      customer = await firstValueFrom(
        this.customersClient.send('customers.findOne', {
          id: createOrderDto.customerId,
          traceId,
          serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(timeout(8000), retry(1)),
      );
    } catch (err) {
      throw new CustomException({
        statusCode: 502,
        message: 'Error comunicando con el microservicio de clientes',
        code: ResponseCodes.CUSTOMER_SERVICE_ERROR,
        traceId,
        meta: { error: err?.message }
      });
    }
    if (!customer) {
      throw new CustomException({
        statusCode: 404,
        message: `Customer with id ${createOrderDto.customerId} not found`,
        code: ResponseCodes.CUSTOMER_NOT_FOUND,
        traceId,
        meta: { customerId: createOrderDto.customerId }
      });
    }

    // Obtener provider
    let provider: any;
    try {
      provider = await firstValueFrom(
        this.providersClient.send('providers.findOne', {
          id: createOrderDto.providerId,
          traceId,
          serviceSecret: process.env.SERVICE_SECRET,
        }).pipe(timeout(8000), retry(1)),
      );
    } catch (err) {
      throw new CustomException({
        statusCode: 502,
        message: 'Error comunicando con el microservicio de proveedores',
        code: ResponseCodes.PROVIDER_SERVICE_ERROR,
        traceId,
        meta: { error: err?.message }
      });
    }
    if (!provider) {
      throw new CustomException({
        statusCode: 404,
        message: `Provider with id ${createOrderDto.providerId} not found`,
        code: ResponseCodes.PROVIDER_NOT_FOUND,
        traceId,
        meta: { providerId: createOrderDto.providerId }
      });
    }

    const items: { name: string; qty: number; unit: string }[] = [];
    for (const item of createOrderDto.items) {
      let product: any;
      try {
        product = await firstValueFrom(
          this.productsClient.send('products.findOne', {
            id: item.productId,
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
          }).pipe(timeout(8000), retry(1)),
        );
      } catch (err) {
        throw new CustomException({
          statusCode: 502,
          message: 'Error comunicando con el microservicio de productos',
          code: ResponseCodes.PRODUCT_SERVICE_ERROR,
          traceId,
          meta: { error: err?.message }
        });
      }
      if (!product) {
        throw new CustomException({
          statusCode: 404,
          message: `Product with id ${item.productId} not found`,
          code: ResponseCodes.PRODUCT_NOT_FOUND,
          traceId,
          meta: { productId: item.productId }
        });
      }
      // Validar que el producto pertenezca al proveedor
      if (!product.providerId || String(product.providerId) !== String(createOrderDto.providerId)) {
        throw new CustomException({
          statusCode: 400,
          message: `El producto ${product.name} no pertenece al proveedor`,
          code: ResponseCodes.MISMATCHED_PROVIDER,
          traceId,
          meta: { productId: item.productId, providerId: createOrderDto.providerId }
        });
      }
      items.push({ qty: item.quantity, name: product.name, unit: product.unit ?? 'unit' });
      if (product.stock < item.quantity) {
        throw new CustomException({
          statusCode: 400,
          message: `Insufficient stock for product ${product.name}`,
          code: ResponseCodes.INSUFFICIENT_STOCK,
          traceId,
          meta: { productId: item.productId, requested: item.quantity, available: product.stock }
        });
      }
    }
    // Disminuir el stock
    for (const item of createOrderDto.items) {
      try {
        await firstValueFrom(
          this.productsClient.send('products.decreaseStock', {
            productId: item.productId,
            quantity: item.quantity,
            traceId,
            serviceSecret: process.env.SERVICE_SECRET,
          }).pipe(timeout(8000), retry(1)),
        );
      } catch (err) {
        throw new CustomException({
          statusCode: 502,
          message: 'Error disminuyendo stock del producto',
          code: ResponseCodes.PRODUCT_SERVICE_ERROR,
          traceId,
          meta: { error: err?.message, productId: item.productId }
        });
      }
    }

    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = new this.orderModel({
      customerId: createOrderDto.customerId,
      providerId: createOrderDto.providerId,
      items: createOrderDto.items,
      totalAmount,
      orderNumber: generateOrderNumber(6),
      status: OrderStatus.PENDING,
    });

    const saved = await order.save();

    // Notificaciones
    this.notificationsClient.emit('notifications.orderCreated', {
      orderNumber: saved.orderNumber,
      userId: customer.userId,
      traceId,
      serviceSecret: process.env.SERVICE_SECRET
    }).pipe(timeout(8000), retry(1));

    this.notificationsClient.emit('notifications.orderRequested', {
      orderNumber: saved.orderNumber,
      userId: provider.userId,
      traceId,
      serviceSecret: process.env.SERVICE_SECRET,
      meta: {
        orderNumber: saved.orderNumber,
        orderItems: items,
        paymentMethod: '--',
        paymentRef: '--',
        userName: customer.name,
        userPhone: customer.phone,
        address: customer.addresses[0]?.street,
        ...(customer.addresses[0]?.coordinates || {}),
      }
    }).pipe(timeout(8000), retry(1));

    return saved;
  }

  async findAll(traceId?: string): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string, traceId?: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new CustomException({
      statusCode: 404,
      message: `Order with id ${id} not found`,
      code: ResponseCodes.ORDER_NOT_FOUND,
      traceId,
      meta: { orderId: id }
    });
    return order;
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    traceId: string,
  ): Promise<Order> {
    // Obtener orden actual
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new CustomException({
        statusCode: 404,
        message: `Order with id ${id} not found`,
        code: ResponseCodes.ORDER_NOT_FOUND,
        traceId,
        meta: { orderId: id }
      });
    }

    // Validar que el nuevo estado sea diferente y transición válida
    if (order.status === updateOrderStatusDto.status) {
      throw new CustomException({
        statusCode: 400,
        message: 'El estado nuevo debe ser diferente al actual',
        code: ResponseCodes.INVALID_ORDER_STATE,
        traceId,
      });
    }
    // Definir transiciones válidas
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
      [OrderStatus.ACCEPTED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.PAID],
      [OrderStatus.PAID]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REJECTED]: [],
    };
    if (!validTransitions[order.status]?.includes(updateOrderStatusDto.status)) {
      throw new CustomException({
        statusCode: 400,
        message: `Transición de estado inválida de ${order.status} a ${updateOrderStatusDto.status}`,
        code: ResponseCodes.INVALID_ORDER_STATE,
        traceId,
      });
    }

    // Actualizar estado
    order.status = updateOrderStatusDto.status;
    await order.save();

    // Obtener customer para notificaciones
    let customer: any;
    try {
      customer = await firstValueFrom(this.customersClient.send('customers.findOne', { id: order.customerId, traceId }));
    } catch (err) {
      customer = null;
    }
    // Notificaciones y lógica especial
    if (updateOrderStatusDto.status === OrderStatus.ACCEPTED) {
      this.notificationsClient.emit('notifications.orderAccepted', {
        orderNumber: order.orderNumber,
        userId: customer?.userId ?? order.customerId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      });
    } else if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        try {
          await firstValueFrom(
            this.productsClient.send('products.increaseStock', {
              productId: item.productId,
              quantity: item.quantity,
              traceId,
              serviceSecret: process.env.SERVICE_SECRET,
            }).pipe(timeout(8000), retry(1)),
          );
        } catch (err) {
          // log error pero continuar
        }
      }
      this.notificationsClient.emit('notifications.orderCancelled', {
        orderNumber: order.orderNumber,
        userId: customer?.userId ?? order.customerId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1));
    } else if (updateOrderStatusDto.status === OrderStatus.DELIVERED) {
      this.notificationsClient.emit('notifications.orderDelivered', {
        orderNumber: order.orderNumber,
        userId: customer?.userId ?? order.customerId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1));
    } else if (updateOrderStatusDto.status === OrderStatus.PAID) {
      this.notificationsClient.emit('notifications.orderPaid', {
        orderNumber: order.orderNumber,
        userId: customer?.userId ?? order.customerId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1));
    } else if (updateOrderStatusDto.status === OrderStatus.REJECTED) {
      this.notificationsClient.emit('notifications.orderRejected', {
        orderNumber: order.orderNumber,
        userId: customer?.userId ?? order.customerId,
        reason: "",
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1));
    } else if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
      this.notificationsClient.emit('notifications.orderShipped', {
        orderNumber: order.orderNumber,
        userId: customer?.userId ?? order.customerId,
        deliveryPerson: "",
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1));
    }

    return order;
  }

  async remove(id: string, traceId?: string): Promise<{ message: string }> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new CustomException({
        statusCode: 404,
        message: `Order with id ${id} not found`,
        code: ResponseCodes.ORDER_NOT_FOUND,
        traceId,
        meta: { orderId: id }
      });
    }
    if ([OrderStatus.PAID, OrderStatus.DELIVERED].includes(order.status)) {
      throw new CustomException({
        statusCode: 400,
        message: 'No se puede eliminar una orden que ya fue pagada o entregada',
        code: ResponseCodes.INVALID_ORDER_STATE,
        traceId,
      });
    }
    await this.orderModel.findByIdAndDelete(id).exec();
    return { message: 'Order deleted successfully' };
  }

  async cancelOrdersByCustomer(customerId: string, traceId: string): Promise<void> {
    const orders = await this.orderModel.find({
      customerId,
      status: {
        $in: [
          OrderStatus.PENDING,
          OrderStatus.ACCEPTED,
        ]
      }
    }).exec();
    if (!orders || orders.length === 0) {
      // No hay órdenes a cancelar, registrar log informativo
      console.info(`[cancelOrdersByCustomer] No hay órdenes pendientes o aceptadas para cancelar del cliente ${customerId}. traceId=${traceId}`);
      return;
    }
    for (const order of orders) {
      order.status = OrderStatus.CANCELLED;
      const saved = await order.save();
      this.notificationsClient.emit('notifications.orderCancelledByCustomer', {
        orderNumber: saved.orderNumber,
        userId: saved.providerId,
        traceId,
        serviceSecret: process.env.SERVICE_SECRET
      }).pipe(timeout(8000), retry(1));
    }
  }

  async markAsPaid(id: string, paymentId: string, traceId: string): Promise<Order> {
    if (!paymentId) {
      throw new CustomException({
        statusCode: 400,
        message: 'paymentId es requerido',
        code: ResponseCodes.REQUIDED_FIELD_MISSING,
        traceId,
      });
    }
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new CustomException({
        statusCode: 404,
        message: `Order with id ${id} not found`,
        code: ResponseCodes.ORDER_NOT_FOUND,
        traceId,
        meta: { orderId: id }
      });
    }
    if ([OrderStatus.PAID, OrderStatus.CANCELLED].includes(order.status)) {
      throw new CustomException({
        statusCode: 400,
        message: `No se puede marcar como pagada una orden en estado ${order.status}`,
        code: ResponseCodes.INVALID_ORDER_STATE,
        traceId,
      });
    }
    order.status = OrderStatus.PAID;
    order.paymentId = paymentId;
    await order.save();

    const customer = await firstValueFrom(this.customersClient.send('customers.findOne', {
      id: order.customerId,
      serviceSecret: process.env.SERVICE_SECRET,
      traceId
    }).pipe(timeout(8000), retry(1))) ?? null;

    this.notificationsClient.emit('notifications.orderPaid', {
      orderNumber: order.orderNumber,
      userId: customer.userId,
      traceId,
      serviceSecret: process.env.SERVICE_SECRET
    });
    return order;
  }
}