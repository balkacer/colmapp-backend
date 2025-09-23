import { Controller } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) { }

  @MessagePattern('products.create')
  create(@Payload() payload: CreateProductDto & { traceId: string }) {
    const { traceId, ...dto } = payload;
    console.log(`[TraceId: ${traceId}] Creating product: `, dto.name);
    return this.productsService.create(dto);
  }

  @MessagePattern('products.findAll')
  findAll(@Payload() payload: { traceId: string }) {
    const { traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching all products`);
    return this.productsService.findAll();
  }

  @MessagePattern('products.findOne')
  findOne(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Fetching product with id: `, id);
    return this.productsService.findOne(id);
  }

  @MessagePattern('products.update')
  update(@Payload() payload: { id: string; dto: UpdateProductDto, traceId: string }) {
    const { id, dto, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Updating product with id: `, id, ' to ', dto);
    return this.productsService.update(id, dto);
  }

  @MessagePattern('products.remove')
  remove(@Payload() payload: { id: string, traceId: string }) {
    const { id, traceId } = payload;
    console.log(`[TraceId: ${traceId}] Removing product with id: `, id);
    return this.productsService.remove(id);
  }
}