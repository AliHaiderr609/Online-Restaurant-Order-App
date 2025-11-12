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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("./entities/cart.entity");
const cart_item_entity_1 = require("./entities/cart-item.entity");
const product_variant_entity_1 = require("../products/entities/product-variant.entity");
let CartService = class CartService {
    constructor(cartRepository, cartItemRepository, variantRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.variantRepository = variantRepository;
    }
    async getOrCreateCart(userId) {
        let cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['items', 'items.variant'],
        });
        if (!cart) {
            cart = this.cartRepository.create({ userId, totalAmount: 0 });
            cart = await this.cartRepository.save(cart);
            cart.items = [];
        }
        return cart;
    }
    async addToCart(userId, addToCartDto) {
        const { productId, variantId, quantity } = addToCartDto;
        const variant = await this.variantRepository.findOne({
            where: { id: variantId, productId },
            relations: ['product'],
        });
        if (!variant) {
            throw new common_1.NotFoundException('Product variant not found');
        }
        if (!variant.isAvailable) {
            throw new common_1.BadRequestException('Product variant is not available');
        }
        const cart = await this.getOrCreateCart(userId);
        let cartItem = await this.cartItemRepository.findOne({
            where: {
                cartId: cart.id,
                productId,
                variantId,
            },
        });
        if (cartItem) {
            cartItem.quantity += quantity;
        }
        else {
            cartItem = this.cartItemRepository.create({
                cartId: cart.id,
                productId,
                variantId,
                quantity,
                price: variant.price,
            });
        }
        await this.cartItemRepository.save(cartItem);
        await this.calculateTotal(cart.id);
        return this.getOrCreateCart(userId);
    }
    async updateCartItem(userId, itemId, updateCartItemDto) {
        const cart = await this.getOrCreateCart(userId);
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: itemId, cartId: cart.id },
        });
        if (!cartItem) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        cartItem.quantity = updateCartItemDto.quantity;
        await this.cartItemRepository.save(cartItem);
        await this.calculateTotal(cart.id);
        return this.getOrCreateCart(userId);
    }
    async removeFromCart(userId, itemId) {
        const cart = await this.getOrCreateCart(userId);
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: itemId, cartId: cart.id },
        });
        if (!cartItem) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        await this.cartItemRepository.remove(cartItem);
        await this.calculateTotal(cart.id);
        return this.getOrCreateCart(userId);
    }
    async getCart(userId) {
        return this.getOrCreateCart(userId);
    }
    async clearCart(userId) {
        const cart = await this.getOrCreateCart(userId);
        await this.cartItemRepository.delete({ cartId: cart.id });
        cart.totalAmount = 0;
        await this.cartRepository.save(cart);
    }
    async calculateTotal(cartId) {
        const items = await this.cartItemRepository.find({
            where: { cartId },
        });
        const total = items.reduce((sum, item) => {
            return sum + Number(item.price) * item.quantity;
        }, 0);
        await this.cartRepository.update(cartId, { totalAmount: total });
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __param(2, (0, typeorm_1.InjectRepository)(product_variant_entity_1.ProductVariant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CartService);
//# sourceMappingURL=cart.service.js.map