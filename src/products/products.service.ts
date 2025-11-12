import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { variants, ...productData } = createProductDto;

    const product = this.productRepository.create(productData);
    const savedProduct = await this.productRepository.save(product);

    const productVariants = variants.map((variant) =>
      this.variantRepository.create({
        ...variant,
        productId: savedProduct.id,
      }),
    );

    savedProduct.variants = await this.variantRepository.save(productVariants);
    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isActive: true },
      relations: ['variants'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { variants, ...productData } = updateProductDto;

    Object.assign(product, productData);
    await this.productRepository.save(product);

    if (variants) {
      await this.variantRepository.delete({ productId: id });

      const productVariants = variants.map((variant) =>
        this.variantRepository.create({
          ...variant,
          productId: id,
        }),
      );

      product.variants = await this.variantRepository.save(productVariants);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepository.save(product);
  }

  async delete(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}

