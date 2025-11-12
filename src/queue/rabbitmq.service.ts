import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'order_processing';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const rabbitmqUrl = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://localhost:5672',
      );
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.queueName, {
        durable: true, 
      });

      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
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

  async publishOrder(orderData: any): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ not available, skipping queue publish');
      return false;
    }

    try {
      const message = JSON.stringify(orderData);
      const sent = this.channel.sendToQueue(
        this.queueName,
        Buffer.from(message),
        {
          persistent: true, 
        },
      );
      
      if (sent) {
        this.logger.log(`Order ${orderData.orderId} published to queue`);
      }
      return sent;
    } catch (error) {
      this.logger.error('Failed to publish order to queue:', error);
      return false;
    }
  }

  async consumeOrders(callback: (orderData: any) => Promise<void>) {
    if (!this.channel) {
      this.logger.warn('RabbitMQ not available, cannot consume orders');
      return;
    }

    try {
      await this.channel.consume(
        this.queueName,
        async (msg) => {
          if (msg && this.channel) {
            try {
              const orderData = JSON.parse(msg.content.toString());
              await callback(orderData);
              this.channel.ack(msg);
            } catch (error) {
              this.logger.error('Error processing order from queue:', error);
              if (this.channel) {
                this.channel.nack(msg, false, true); 
              }
            }
          }
        },
        { noAck: false },
      );
      this.logger.log('Order consumer started');
    } catch (error) {
      this.logger.error('Failed to start order consumer:', error);
    }
  }
}

