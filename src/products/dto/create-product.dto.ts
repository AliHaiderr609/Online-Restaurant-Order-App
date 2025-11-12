import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiProperty({ example: '8pc' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 12.99 })
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Chicken Wings' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Delicious crispy chicken wings', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'Appetizers', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ type: [CreateProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];
}

