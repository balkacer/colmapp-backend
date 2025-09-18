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
  create(@Payload() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @MessagePattern('products.findAll')
  findAll() {
    return this.productsService.findAll();
  }

  @MessagePattern('products.findOne')
  findOne(@Payload() id: string) {
    return this.productsService.findOne(id);
  }

  @MessagePattern('products.update')
  update(@Payload() payload: { id: string; dto: UpdateProductDto }) {
    return this.productsService.update(payload.id, payload.dto);
  }

  @MessagePattern('products.remove')
  remove(@Payload() id: string) {
    console.log('Removing product with id:', id);
    return this.productsService.remove(id);
  }
}