import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, IsInt, IsOptional, IsUrl, MaxLength, Min, MinLength, IsEnum, } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
    @ApiProperty()
    @IsString()
    @MinLength(5)
    @MaxLength(200)
    title!: string;

    @ApiProperty()
    @IsString()
    @MinLength(10)
    @MaxLength(1000)
    description!: string;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price!: number;

    @ApiProperty()
    @IsString()
    currency!: string;

    @ApiProperty()
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    location!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MinLength(5)
    @MaxLength(500)
    address?: string;

    @ApiProperty()
    @IsString()
    @MinLength(2)
    city!: string;

    @ApiProperty()
    @IsString()
    @MinLength(2)
    state!: string;

    @ApiProperty()
    @IsString()
    @MinLength(2)
    propertyType!: string;

    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    bedrooms!: number;

    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    bathrooms!: number;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    amenities?: string[];

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    images?: string[];
}
