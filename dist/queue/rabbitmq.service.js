"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RabbitMQService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = require("amqplib");
let RabbitMQService = RabbitMQService_1 = class RabbitMQService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RabbitMQService_1.name);
        this.connection = null;
        this.channel = null;
        this.queueName = 'order_processing';
    }
    async onModuleInit() {
        try {
            const rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://localhost:5672');
            this.connection = await amqp.connect(rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.queueName, {
                durable: true,
            });
            this.logger.log('RabbitMQ connected successfully');
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ:', error);
            if (this.configService.get('NODE_ENV') === 'production') {
                throw error;
            }
        }
    }
    async onModuleDestroy() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
    }
    async publishOrder(orderData) {
        if (!this.channel) {
            this.logger.warn('RabbitMQ not available, skipping queue publish');
            return false;
        }
        try {
            const message = JSON.stringify(orderData);
            const sent = this.channel.sendToQueue(this.queueName, Buffer.from(message), {
                persistent: true,
            });
            if (sent) {
                this.logger.log(`Order ${orderData.orderId} published to queue`);
            }
            return sent;
        }
        catch (error) {
            this.logger.error('Failed to publish order to queue:', error);
            return false;
        }
    }
    async consumeOrders(callback) {
        if (!this.channel) {
            this.logger.warn('RabbitMQ not available, cannot consume orders');
            return;
        }
        try {
            await this.channel.consume(this.queueName, async (msg) => {
                if (msg && this.channel) {
                    try {
                        const orderData = JSON.parse(msg.content.toString());
                        await callback(orderData);
                        this.channel.ack(msg);
                    }
                    catch (error) {
                        this.logger.error('Error processing order from queue:', error);
                        if (this.channel) {
                            this.channel.nack(msg, false, true);
                        }
                    }
                }
            }, { noAck: false });
            this.logger.log('Order consumer started');
        }
        catch (error) {
            this.logger.error('Failed to start order consumer:', error);
        }
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = RabbitMQService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map