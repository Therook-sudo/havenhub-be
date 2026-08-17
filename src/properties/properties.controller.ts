import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { QueryPropertyDto } from './dto/query-property.dto';
import { CreatePropertyDto } from '../property/dto/create-property.dto';
import { UpdatePropertyDto } from '../property/dto/update-property.dto';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUser(req: Request, headerLandlordId?: string): string {
    // 1. Check Bearer token in Authorization header
    const rawAuth = req.headers.authorization || '';
    let token = rawAuth.trim();
    while (token.toLowerCase().startsWith('bearer ')) {
      token = token.substring(7).trim();
    }

    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        if (payload && payload.sub) return payload.sub;
      } catch {
        // Fallback to x-user-id header if JWT verification fails or is expired in testing
      }
    }

    // 2. Fallback to x-user-id header
    if (headerLandlordId && headerLandlordId.trim().length > 0) {
      return headerLandlordId.trim();
    }

    throw new BadRequestException('Authentication required. Provide a Bearer JWT token or x-user-id header.');
  }

  @Get()
  @ApiOperation({
    summary: 'Public Property Discovery Feed',
    description: 'Search and filter verified property listings with pagination.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of property listings' })
  async findAll(@Query() queryDto: QueryPropertyDto) {
    return this.propertiesService.findAll(queryDto);
  }

  @Get('my-listings')
  @ApiOperation({
    summary: 'Get Landlord Listings',
    description: 'Fetch property listings belonging to the authenticated Landlord.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'x-user-id', required: false, description: 'Landlord User UUID (Testing Header fallback)' })
  @ApiResponse({ status: 200, description: 'List of landlord properties' })
  @ApiResponse({ status: 400, description: 'Missing user identification' })
  async findMyListings(
    @Req() req: Request,
    @Headers('x-user-id') headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId);
    return this.propertiesService.findMyListings(landlordId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create New Property Listing',
    description: 'Create a new property listing as a Landlord or Agent.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'x-user-id', required: false, description: 'Landlord User UUID (Testing Header fallback)' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Req() req: Request,
    @Headers('x-user-id') headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId);
    return this.propertiesService.create(createPropertyDto, landlordId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update Property Listing',
    description: 'Update an existing property listing owned by the landlord.',
  })
  @ApiParam({ name: 'id', description: 'Unique Property UUID' })
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'x-user-id', required: false, description: 'Landlord User UUID' })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: Request,
    @Headers('x-user-id') headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId);
    return this.propertiesService.update(id, updatePropertyDto, landlordId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Property Listing',
    description: 'Delete a property listing owned by the landlord.',
  })
  @ApiParam({ name: 'id', description: 'Unique Property UUID' })
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'x-user-id', required: false, description: 'Landlord User UUID' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId);
    await this.propertiesService.remove(id, landlordId);
    return { message: 'Property deleted successfully' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Detailed Property View',
    description: 'Fetch full listing details by Property ID including landlord profile.',
  })
  @ApiParam({ name: 'id', description: 'Unique Property UUID' })
  @ApiResponse({ status: 200, description: 'Property detail view' })
  @ApiResponse({ status: 404, description: 'Property listing not found' })
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }
}
