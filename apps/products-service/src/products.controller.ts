import { Controller, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ServiceAuthGuard } from '@colmapp/guards';

@Controller()
@UseGuards(ServiceAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) { }

  @MessagePattern('products.create')
  create(@Payload() payload: CreateProductDto & { traceId: string; serviceSecret: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating product: `, dto.name);
    return this.productsService.create(dto);
  }

  @MessagePattern('products.findAll')
  findAll(@Payload() payload: { serviceSecret: string; traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all products`);
    return this.productsService.findAll();
  }

  @MessagePattern('products.findOne')
  findOne(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching product with id: `, id);
    return this.productsService.findOne(id);
  }

  @MessagePattern('products.update')
  update(@Payload() payload: { serviceSecret: string; id: string; dto: UpdateProductDto, traceId: string }) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating product with id: `, id, ' to ', dto);
    return this.productsService.update(id, dto);
  }

  @MessagePattern('products.remove')
  remove(@Payload() payload: { serviceSecret: string; id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing product with id: `, id);
    return this.productsService.remove(id);
  }

  @MessagePattern('products.decreaseStock')
  async decreaseStock(@Payload() payload: { serviceSecret: string; productId: string; quantity: number, traceId: string }) {
    const { traceId, productId, quantity } = payload;
    console.log(`[TraceId: ${traceId}] Decreasing stock for productId: `, productId, ' by ', quantity);
    return this.productsService.decreaseStock(productId, quantity, traceId);
  }

  @MessagePattern('products.increaseStock')
  async increaseStock(@Payload() payload: { serviceSecret: string; productId: string; quantity: number, traceId: string }) {
    const { traceId, productId, quantity } = payload;
    console.log(`[TraceId: ${traceId}] Increasing stock for productId: `, productId, ' by ', quantity);
    return this.productsService.increaseStock(productId, quantity);
  }
}