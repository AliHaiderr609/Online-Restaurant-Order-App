"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const product_variant_entity_1 = require("./entities/product-variant.entity");
let ProductsService = class ProductsService {
    constructor(productRepository, variantRepository) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }
    async create(createProductDto) {
        const { variants, ...productData } = createProductDto;
        const product = this.productRepository.create(productData);
        const savedProduct = await this.productRepository.save(product);
        const productVariants = variants.map((variant) => this.variantRepository.create({
            ...variant,
            productId: savedProduct.id,
        }));
        savedProduct.variants = await this.variantRepository.save(productVariants);
        return savedProduct;
    }
    async findAll() {
        return this.productRepository.find({
            where: { isActive: true },
            relations: ['variants'],
        });
    }
    async findOne(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['variants'],
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }
    async update(id, updateProductDto) {
        const product = await this.findOne(id);
        const { variants, ...productData } = updateProductDto;
        Object.assign(product, productData);
        await this.productRepository.save(product);
        if (variants) {
            await this.variantRepository.delete({ productId: id });
            const productVariants = variants.map((variant) => this.variantRepository.create({
                ...variant,
                productId: id,
            }));
            product.variants = await this.variantRepository.save(productVariants);
        }
        return this.findOne(id);
    }
    async remove(id) {
        const product = await this.findOne(id);
        product.isActive = false;
        await this.productRepository.save(product);
    }
    async delete(id) {
        const result = await this.productRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_variant_entity_1.ProductVariant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map