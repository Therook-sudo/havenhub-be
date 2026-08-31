import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingStatus } from '../../entities/enums';

export enum PropertySortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class QueryPropertyDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Number of records per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search keyword matching title, description, address, or location' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by city (e.g. Lagos, Ikeja, Lekki)' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state (e.g. Lagos State, FCT, Abuja)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by specific neighborhood or location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Filter by property type (e.g. Apartment, House, Duplex, Studio, Villa)' })
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Exact or minimum number of bedrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Exact or minimum number of bathrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Filter by amenity keyword (e.g. Swimming Pool, 24/7 Power, Security)' })
  @IsOptional()
  @IsString()
  amenity?: string;

  @ApiPropertyOptional({
    enum: PropertySortBy,
    default: PropertySortBy.NEWEST,
    description: 'Sort ordering: price_asc, price_desc, newest, oldest',
  })
  @IsOptional()
  @IsEnum(PropertySortBy)
  sortBy?: PropertySortBy = PropertySortBy.NEWEST;

  @ApiPropertyOptional({ enum: ListingStatus, description: 'Filter by listing status (Admin / Moderation use)' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}
