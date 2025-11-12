import { IsString, IsNotEmpty, IsEmail, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpRequestDto {
  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phoneNumber?: string;
}

