import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [AdminController],
})
export class AdminModule {}

