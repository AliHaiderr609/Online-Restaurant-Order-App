import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentType, example: PaymentType.CASH, required: false })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;
}

