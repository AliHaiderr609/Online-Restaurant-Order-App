import { ProductsService } from '../products/products.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
export declare class AdminController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<import("../products/entities/product.entity").Product>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<import("../products/entities/product.entity").Product>;
    remove(id: string): Promise<void>;
    delete(id: string): Promise<void>;
}
