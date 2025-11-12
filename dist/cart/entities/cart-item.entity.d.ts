import { Cart } from './cart.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
export declare class CartItem {
    id: string;
    cartId: string;
    cart: Cart;
    productId: string;
    variantId: string;
    variant: ProductVariant;
    quantity: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}
