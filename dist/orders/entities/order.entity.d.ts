import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    PROCESSING = "processing",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum PaymentType {
    CASH = "cash",
    CARD = "card",
    ONLINE = "online"
}
export declare class Order {
    id: string;
    orderId: string;
    userId: string;
    user: User;
    items: OrderItem[];
    totalAmount: number;
    paymentType: PaymentType;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}
