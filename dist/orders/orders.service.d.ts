import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { RabbitMQService } from '../queue/rabbitmq.service';
export declare class OrdersService {
    private orderRepository;
    private orderItemRepository;
    private cartRepository;
    private cartItemRepository;
    private variantRepository;
    private rabbitMQService;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, cartRepository: Repository<Cart>, cartItemRepository: Repository<CartItem>, variantRepository: Repository<ProductVariant>, rabbitMQService: RabbitMQService);
    create(userId: string, createOrderDto: CreateOrderDto): Promise<Order>;
    findAll(userId: string): Promise<Order[]>;
    findOne(id: string, userId?: string): Promise<Order>;
    updateStatus(id: string, status: OrderStatus, userId?: string): Promise<Order>;
    private generateOrderId;
}
