import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
export declare class CartService {
    private cartRepository;
    private cartItemRepository;
    private variantRepository;
    constructor(cartRepository: Repository<Cart>, cartItemRepository: Repository<CartItem>, variantRepository: Repository<ProductVariant>);
    getOrCreateCart(userId: string): Promise<Cart>;
    addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart>;
    updateCartItem(userId: string, itemId: string, updateCartItemDto: UpdateCartItemDto): Promise<Cart>;
    removeFromCart(userId: string, itemId: string): Promise<Cart>;
    getCart(userId: string): Promise<Cart>;
    clearCart(userId: string): Promise<void>;
    private calculateTotal;
}
