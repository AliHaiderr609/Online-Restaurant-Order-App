import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private connection;
    private channel;
    private readonly queueName;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishOrder(orderData: any): Promise<boolean>;
    consumeOrders(callback: (orderData: any) => Promise<void>): Promise<void>;
}
