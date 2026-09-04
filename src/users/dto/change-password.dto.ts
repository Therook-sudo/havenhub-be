import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!', description: 'Current user password' })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'New password (minimum 8 characters)' })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}
