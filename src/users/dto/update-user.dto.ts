import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../entities/enums';
import { normalizeRole } from './register-user.dto';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Haven' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Hub' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348123456789' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: Role,
    example: Role.PROPERTY_SEEKER,
    description: 'Updated user role: PROPERTY_SEEKER (or SEEKER/TENANT), LANDLORD, REAL_ESTATE_AGENT, PROPERTY_MANAGER',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeRole(value))
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
