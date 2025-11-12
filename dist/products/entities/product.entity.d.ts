import { ProductVariant } from './product-variant.entity';
export declare class Product {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    isActive: boolean;
    variants: ProductVariant[];
    createdAt: Date;
    updatedAt: Date;
}
