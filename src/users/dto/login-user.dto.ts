import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginUserDto {
  @ApiProperty({ example: 'test@havenhub.com', description: 'User registered email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User account password' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ description: 'Optional user role hint submitted by frontend' })
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: 'Optional remember me flag' })
  @IsOptional()
  rememberMe?: boolean;
}
