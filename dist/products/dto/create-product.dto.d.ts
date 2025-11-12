export declare class CreateProductVariantDto {
    name: string;
    price: number;
    isAvailable?: boolean;
}
export declare class CreateProductDto {
    name: string;
    description?: string;
    imageUrl?: string;
    category?: string;
    variants: CreateProductVariantDto[];
}
