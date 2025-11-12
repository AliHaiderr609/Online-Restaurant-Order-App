import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PromoteAdminDto {
  @ApiProperty({ example: 'user-uuid', description: 'User ID to promote to admin' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'your-admin-secret-key', description: 'Admin secret key from environment (ADMIN_SECRET_KEY)' })
  @IsString()
  @IsNotEmpty()
  secretKey: string;
}

