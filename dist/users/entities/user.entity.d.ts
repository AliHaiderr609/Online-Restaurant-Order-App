import { Cart } from '../../cart/entities/cart.entity';
import { Order } from '../../orders/entities/order.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    tokens: string;
    isAdmin: boolean;
    cart: Cart;
    orders: Order[];
    createdAt: Date;
    updatedAt: Date;
}
