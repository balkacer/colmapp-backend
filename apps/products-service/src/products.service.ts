import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, retry, timeout } from 'rxjs';
import { CustomException } from '@colmapp/exceptions';
import { ResponseCodes } from '@colmapp/types';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject('NOTIFICATIONS_SERVICE') private readonly notificationsClient: ClientProxy,
    @Inject('PROVIDERS_SERVICE') private readonly providersClient: ClientProxy,
  ) { }

  async create(dto: CreateProductDto): Promise<Product> {
    const { name, price, stock, providerId } = dto;
    if (!name || price === undefined || stock === undefined || !providerId) {
      throw new CustomException({
        statusCode: 400,
        message: 'Missing required fields: name, price, stock, providerId',
        code: ResponseCodes.BAD_REQUEST,
      });
    }
    if (price <= 0 || stock < 0) {
      throw new CustomException({
        statusCode: 400,
        message: 'Price must be positive and stock must be non-negative',
        code: ResponseCodes.BAD_REQUEST,
      });
    }
    const existingProduct = await this.productModel.findOne({ name, providerId }).exec();
    if (existingProduct) {
      throw new CustomException({
        statusCode: 400,
        message: 'Product already exists with the same name and provider',
        code: ResponseCodes.PRODUCT_ALREADY_EXISTS,
      });
    }
    const created = new this.productModel(dto);
    return created.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string, traceId?: string): Promise<Product> {
    if (!id || !isValidObjectId(id)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid product id',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
      });
    }
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new CustomException({
      statusCode: 404,
      message: 'Product not found',
      code: ResponseCodes.PRODUCT_NOT_FOUND,
      traceId,
      meta: { productId: id }
    });
    return product;
  }

  async update(id: string, dto: UpdateProductDto, traceId?: string): Promise<Product> {
    if (!id || !isValidObjectId(id)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid product id',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
      });
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new CustomException({
      statusCode: 404,
      message: 'Product not found',
      code: ResponseCodes.PRODUCT_NOT_FOUND,
      traceId,
      meta: { productId: id }
    });
    return updated;
  }

  async remove(id: string, traceId?: string): Promise<{ message: string }> {
    if (!id || !isValidObjectId(id)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid product id',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
      });
    }
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) throw new CustomException({
      statusCode: 404,
      message: 'Product not found',
      code: ResponseCodes.PRODUCT_NOT_FOUND,
      traceId,
      meta: { productId: id }
    });
    return { message: 'Product deleted successfully' };
  }

  async decreaseStock(productId: string, quantity: number, traceId: string): Promise<{ success: boolean; product: Product }> {
  if (!productId || !isValidObjectId(productId)) {
    throw new CustomException({
      statusCode: 400,
      message: 'Invalid product id',
      code: ResponseCodes.BAD_REQUEST,
      traceId,
    });
  }

  if (quantity <= 0) {
    throw new CustomException({
      statusCode: 400,
      message: 'Quantity must be positive',
      code: ResponseCodes.BAD_REQUEST,
      traceId,
    });
  }

  const product = await this.productModel.findById(productId).exec();
  if (!product) {
    throw new CustomException({
      statusCode: 404,
      message: 'Product not found',
      code: ResponseCodes.PRODUCT_NOT_FOUND,
      traceId,
      meta: { productId },
    });
  }

  // Validar proveedor existente
  const provider = await firstValueFrom(this.providersClient
    .send('providers.findOne', { id: product.providerId, traceId, serviceSecret: process.env.SERVICE_SECRET })
    .pipe(timeout(8000), retry(1)));

  if (!provider) {
    throw new CustomException({
      statusCode: 404,
      message: 'Provider not found',
      code: ResponseCodes.PROVIDER_NOT_FOUND,
      traceId,
      meta: { providerId: product.providerId },
    });
  }

  if (provider._id?.toString() !== product.providerId.toString()) {
    throw new CustomException({
      statusCode: 400,
      message: 'Product provider mismatch',
      code: ResponseCodes.PRODUCT_PROVIDER_MISMATCH,
      traceId,
      meta: { productId, providerId: product.providerId },
    });
  }

  if (product.stock < quantity) {
    throw new CustomException({
      statusCode: 400,
      message: 'Insufficient stock',
      code: ResponseCodes.INSUFFICIENT_STOCK,
      traceId,
      meta: { productId, requested: quantity, available: product.stock },
    });
  }

  product.stock -= quantity;
  const saved = await product.save();

  // Enviar notificaciones si aplica
  try {
    if (saved.stock < 5 && saved.stock > 0) {
      await firstValueFrom(this.notificationsClient
        .emit('notifications.productLowStock', {
          productId: saved._id,
          userId: saved.providerId,
          stock: saved.stock,
          traceId,
          serviceSecret: process.env.SERVICE_SECRET,
        })
        .pipe(timeout(8000), retry(1)));
    } else if (saved.stock <= 0) {
      await firstValueFrom(this.notificationsClient
        .emit('notifications.productOutOfStock', {
          productId: saved._id,
          userId: saved.providerId,
          traceId,
          serviceSecret: process.env.SERVICE_SECRET,
        })
        .pipe(timeout(8000), retry(1)));
    }
  } catch (notifyError) {
    console.warn(`[TraceId: ${traceId}] ⚠ Error sending stock notification:`, notifyError.message);
  }

  // ✅ IMPORTANTE: devolver una respuesta
  return { success: true, product: saved };
}

  async increaseStock(productId: string, quantity: number, traceId?: string): Promise<Product> {
    if (!productId || !isValidObjectId(productId)) {
      throw new CustomException({
        statusCode: 400,
        message: 'Invalid product id',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
      });
    }
    if (quantity <= 0) {
      throw new CustomException({
        statusCode: 400,
        message: 'Quantity must be positive',
        code: ResponseCodes.BAD_REQUEST,
        traceId,
      });
    }
    const product = await this.productModel.findById(productId).exec();
    if (!product) throw new CustomException({
      statusCode: 404,
      message: 'Product not found',
      traceId,
      code: ResponseCodes.PRODUCT_NOT_FOUND,
      meta: { productId }
    });

    product.stock += quantity;
    return product.save();
  }
}