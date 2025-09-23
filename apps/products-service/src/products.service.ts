import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) { }

  async create(dto: CreateProductDto): Promise<Product> {
    const created = new this.productModel(dto);
    return created.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const updated = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Product not found');
    return { message: 'Product deleted successfully' };
  }

  async decreaseStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (product.stock < quantity) throw new BadRequestException(`Not enough stock for product ${productId}`);

    product.stock -= quantity;
    return product.save();
  }

  async increaseStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    product.stock += quantity;
    return product.save();
  }
}