import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction, AuditTargetType } from '../../entities/enums';

export class QueryAuditLogDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Number of audit log records per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: AuditAction, description: 'Filter by specific administrative action' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ enum: AuditTargetType, description: 'Filter by target entity type' })
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional({ description: 'Filter by specific Admin UUID' })
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific target entity UUID' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Keyword search across details and action' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter logs on or after this ISO date (e.g. 2026-08-01)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter logs on or before this ISO date (e.g. 2026-08-31)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
