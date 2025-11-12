import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any, createOrderDto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    findAll(req: any): Promise<import("./entities/order.entity").Order[]>;
    findOne(req: any, id: string): Promise<import("./entities/order.entity").Order>;
    updateStatus(req: any, id: string, status: OrderStatus): Promise<import("./entities/order.entity").Order>;
}
