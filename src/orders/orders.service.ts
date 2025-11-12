import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderStatus, PaymentType } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { RabbitMQService } from '../queue/rabbitmq.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private rabbitMQService: RabbitMQService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Verify all variants are still available and get product info
    const variantMap = new Map<string, { variant: ProductVariant; productName: string }>();
    for (const item of cart.items) {
      const variant = await this.variantRepository.findOne({
        where: { id: item.variantId },
        relations: ['product'],
      });

      if (!variant || !variant.isAvailable) {
        throw new BadRequestException(
          `Product variant ${item.variantId} is no longer available`,
        );
      }

      if (!variant.product) {
        throw new BadRequestException(
          `Product for variant ${item.variantId} not found`,
        );
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
      paymentType: createOrderDto.paymentType || PaymentType.CASH,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItems = cart.items.map((cartItem) => {
      const variantInfo = variantMap.get(cartItem.variantId);
      if (!variantInfo) {
        throw new BadRequestException(
          `Variant information not found for cart item ${cartItem.id}`,
        );
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

  async findAll(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.orderRepository.findOne({
      where,
      relations: ['items', 'items.variant'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    userId?: string,
  ): Promise<Order> {
    const order = await this.findOne(id, userId);
    order.status = status;
    return this.orderRepository.save(order);
  }

  private generateOrderId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = uuidv4().substring(0, 4).toUpperCase();

    return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }
}

