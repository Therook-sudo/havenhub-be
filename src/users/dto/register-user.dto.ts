import { Role } from '../../entities/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export function normalizeRole(raw: any): Role {
  if (typeof raw !== 'string') return Role.PROPERTY_SEEKER;
  const upper = raw.trim().toUpperCase();
  if (upper === 'SEEKER' || upper === 'TENANT' || upper === 'PROPERTY_SEEKER') {
    return Role.PROPERTY_SEEKER;
  }
  if (upper === 'LANDLORD') {
    return Role.LANDLORD;
  }
  if (upper === 'AGENT' || upper === 'REAL_ESTATE_AGENT') {
    return Role.REAL_ESTATE_AGENT;
  }
  if (upper === 'MANAGER' || upper === 'PROPERTY_MANAGER') {
    return Role.PROPERTY_MANAGER;
  }
  if (upper === 'ADMIN') {
    return Role.ADMIN;
  }
  return Role.PROPERTY_SEEKER;
}

export class RegisterUserDto {
  @ApiProperty({ example: 'test@havenhub.com', description: 'User email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Password (minimum 8 characters)' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Haven', description: 'User first name' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Hub', description: 'User last name' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName!: string;

  @ApiProperty({
    enum: Role,
    example: Role.PROPERTY_SEEKER,
    description:
      'Mandatory user role: PROPERTY_SEEKER (or SEEKER/TENANT), LANDLORD, REAL_ESTATE_AGENT, PROPERTY_MANAGER, ADMIN',
  })
  @Transform(({ value }) => normalizeRole(value))
  @IsNotEmpty({ message: 'Role is mandatory during registration' })
  @IsEnum(Role, {
    message: `Role is mandatory and must be one of: ${Object.values(Role).join(', ')}`,
  })
  role: Role = Role.PROPERTY_SEEKER;
}
