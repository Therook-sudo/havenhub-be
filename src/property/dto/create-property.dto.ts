import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  MaxLength,
  Min,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePropertyDto {
  @ApiProperty({ example: '3 Bedroom Apartment, Lekki Phase 1', description: 'Listing title' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Modern serviced apartment with 24/7 power...', description: 'Detailed property description' })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  @MinLength(5, { message: 'Description must be at least 5 characters' })
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 3500000, description: 'Listing price / rent price (NGN)' })
  @Transform(({ value, obj }) => {
    const raw = value !== undefined && value !== null && value !== '' ? value : obj?.rentPrice;
    return raw !== undefined && raw !== null ? Number(raw) : undefined;
  })
  @IsNotEmpty({ message: 'Price (or rentPrice) is required' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number' })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 3500000, description: 'Frontend alias for price' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentPrice?: number;

  @ApiPropertyOptional({ example: 'NGN', default: 'NGN' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim().toUpperCase() : 'NGN',
  )
  @IsString()
  currency: string = 'NGN';

  @ApiPropertyOptional({ example: 'Lekki Phase 1, Lagos', description: 'Neighborhood / Location' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    return obj?.address || obj?.city || 'Lagos';
  })
  @IsString()
  location: string = 'Lagos';

  @ApiPropertyOptional({ example: 'Admiralty Way, Lekki', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'Lagos', default: 'Lagos' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    return obj?.location || obj?.state || 'Lagos';
  })
  @IsString()
  city: string = 'Lagos';

  @ApiPropertyOptional({ example: 'Lagos State', default: 'Lagos State' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    return obj?.city || 'Lagos State';
  })
  @IsString()
  state: string = 'Lagos State';

  @ApiPropertyOptional({ example: 'Apartment', default: 'Apartment' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Apartment',
  )
  @IsString()
  propertyType: string = 'Apartment';

  @ApiProperty({ example: 3, description: 'Number of bedrooms' })
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10) || 1;
    return typeof value === 'number' ? value : 1;
  })
  @IsInt({ message: 'Bedrooms must be an integer number' })
  @Min(0)
  bedrooms!: number;

  @ApiProperty({ example: 2, description: 'Number of bathrooms' })
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10) || 1;
    return typeof value === 'number' ? value : 1;
  })
  @IsInt({ message: 'Bathrooms must be an integer number' })
  @Min(0)
  bathrooms!: number;

  @ApiPropertyOptional({ example: 2, description: 'Floor number', required: false })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  @IsNumber()
  floorNumber?: number;

  @ApiPropertyOptional({ example: 150, description: 'Square footage in sqm', required: false })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  @IsNumber()
  squareFootage?: number;

  @ApiPropertyOptional({ type: [String], required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  })
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional({ type: [String], required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  })
  @IsArray()
  images?: string[];
}
