import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
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

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, variantId, quantity } = addToCartDto;

    const variant = await this.variantRepository.findOne({
      where: { id: variantId, productId },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (!variant.isAvailable) {
      throw new BadRequestException('Product variant is not available');
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
    } else {
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

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.quantity = updateCartItemDto.quantity;
    await this.cartItemRepository.save(cartItem);

    await this.calculateTotal(cart.id);

    return this.getOrCreateCart(userId);
  }

  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);

    await this.calculateTotal(cart.id);

    return this.getOrCreateCart(userId);
  }

  async getCart(userId: string): Promise<Cart> {
    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.id });
    cart.totalAmount = 0;
    await this.cartRepository.save(cart);
  }

  private async calculateTotal(cartId: string): Promise<void> {
    const items = await this.cartItemRepository.find({
      where: { cartId },
    });

    const total = items.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    await this.cartRepository.update(cartId, { totalAmount: total });
  }
}

