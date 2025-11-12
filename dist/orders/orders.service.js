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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const cart_entity_1 = require("../cart/entities/cart.entity");
const cart_item_entity_1 = require("../cart/entities/cart-item.entity");
const product_variant_entity_1 = require("../products/entities/product-variant.entity");
const rabbitmq_service_1 = require("../queue/rabbitmq.service");
let OrdersService = class OrdersService {
    constructor(orderRepository, orderItemRepository, cartRepository, cartItemRepository, variantRepository, rabbitMQService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.variantRepository = variantRepository;
        this.rabbitMQService = rabbitMQService;
    }
    async create(userId, createOrderDto) {
        const cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['items', 'items.variant', 'items.variant.product'],
        });
        if (!cart || !cart.items || cart.items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const variantMap = new Map();
        for (const item of cart.items) {
            const variant = await this.variantRepository.findOne({
                where: { id: item.variantId },
                relations: ['product'],
            });
            if (!variant || !variant.isAvailable) {
                throw new common_1.BadRequestException(`Product variant ${item.variantId} is no longer available`);
            }
            if (!variant.product) {
                throw new common_1.BadRequestException(`Product for variant ${item.variantId} not found`);
            }
            variantMap.set(item.variantId, {
                variant,
                productName: variant.product.name,
            });
        }
        const orderId = this.generateOrderId();
        const order = this.orderRepository.create({
            orderId,
            userId,
            totalAmount: cart.totalAmount,
            paymentType: createOrderDto.paymentType || order_entity_1.PaymentType.CASH,
            status: order_entity_1.OrderStatus.PENDING,
        });
        const savedOrder = await this.orderRepository.save(order);
        const orderItems = cart.items.map((cartItem) => {
            const variantInfo = variantMap.get(cartItem.variantId);
            if (!variantInfo) {
                throw new common_1.BadRequestException(`Variant information not found for cart item ${cartItem.id}`);
            }
            return this.orderItemRepository.create({
                orderId: savedOrder.id,
                productId: cartItem.productId,
                variantId: cartItem.variantId,
                productName: variantInfo.productName,
                variantName: variantInfo.variant.name,
                quantity: cartItem.quantity,
                price: cartItem.price,
            });
        });
        savedOrder.items = await this.orderItemRepository.save(orderItems);
        await this.rabbitMQService.publishOrder({
            orderId: savedOrder.orderId,
            userId: savedOrder.userId,
            totalAmount: savedOrder.totalAmount,
            paymentType: savedOrder.paymentType,
            items: orderItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
            })),
        });
        await this.cartItemRepository.delete({ cartId: cart.id });
        cart.totalAmount = 0;
        await this.cartRepository.save(cart);
        return this.findOne(savedOrder.id);
    }
    async findAll(userId) {
        return this.orderRepository.find({
            where: { userId },
            relations: ['items'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const where = { id };
        if (userId) {
            where.userId = userId;
        }
        const order = await this.orderRepository.findOne({
            where,
            relations: ['items', 'items.variant'],
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order with ID ${id} not found`);
        }
        return order;
    }
    async updateStatus(id, status, userId) {
        const order = await this.findOne(id, userId);
        order.status = status;
        return this.orderRepository.save(order);
    }
    generateOrderId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const random = (0, uuid_1.v4)().substring(0, 4).toUpperCase();
        return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(3, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __param(4, (0, typeorm_1.InjectRepository)(product_variant_entity_1.ProductVariant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        rabbitmq_service_1.RabbitMQService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map