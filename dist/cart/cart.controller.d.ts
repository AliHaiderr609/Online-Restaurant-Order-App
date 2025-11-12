import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(req: any): Promise<import("./entities/cart.entity").Cart>;
    addToCart(req: any, addToCartDto: AddToCartDto): Promise<import("./entities/cart.entity").Cart>;
    updateCartItem(req: any, itemId: string, updateCartItemDto: UpdateCartItemDto): Promise<import("./entities/cart.entity").Cart>;
    removeFromCart(req: any, itemId: string): Promise<import("./entities/cart.entity").Cart>;
    clearCart(req: any): Promise<void>;
}
