import { Order } from './order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
export declare class OrderItem {
    id: string;
    orderId: string;
    order: Order;
    productId: string;
    variantId: string;
    variant: ProductVariant;
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
    createdAt: Date;
}
