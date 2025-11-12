import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';
export declare class Cart {
    id: string;
    userId: string;
    user: User;
    items: CartItem[];
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}
