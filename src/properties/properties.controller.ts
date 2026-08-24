import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { QueryPropertyDto } from './dto/query-property.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { CreatePropertyDto } from '../property/dto/create-property.dto';
import { UpdatePropertyDto } from '../property/dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ListingStatus } from '../entities/enums';
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
    description: 'Fetch verified property listings with pagination and sorting.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of property listings' })
  async findAll(@Query() queryDto: QueryPropertyDto) {
    return this.propertiesService.findAll(queryDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Dynamic Search & Multi-Filter Engine',
    description:
      'Search properties with multi-parameter filtering: keyword search, location/city/state, price ranges, bedrooms, bathrooms, amenities, and sorting.',
  })
  @ApiResponse({ status: 200, description: 'Search results matching criteria with pagination metadata' })
  async search(@Query() queryDto: QueryPropertyDto) {
    return this.propertiesService.search(queryDto);
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

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update Property Listing Status (Admin Moderation)',
    description:
      'Move a listing through the moderation workflow. **Requires an `ADMIN` Bearer JWT.**\n\n' +
      '| Status | Effect |\n' +
      '| --- | --- |\n' +
      '| `PENDING_REVIEW` | Returns the listing to the moderation queue and hides it from the public feed. |\n' +
      '| `APPROVED` | Publishes the listing to the public discovery feed. |\n' +
      '| `REJECTED` | Rejects the listing; the optional `rejectionReason` is stored and shown to the landlord. |\n\n' +
      '`rejectionReason` is persisted only for `REJECTED` — any previously stored reason is cleared ' +
      'when a listing is approved or sent back for review.\n\n' +
      '**Related feature flag:** when `DEV_AUTO_APPROVE_LISTINGS=true`, newly created listings are already ' +
      '`APPROVED` and normally do not need this endpoint. With the flag `false` (production default), new ' +
      'listings start as `PENDING_REVIEW` and an admin must approve them here.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Unique Property UUID' })
  @ApiBody({ type: UpdatePropertyStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Listing status updated successfully',
    schema: {
      example: {
        id: '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa',
        title: '3 Bedroom Serviced Apartment, Lekki Phase 1',
        status: ListingStatus.REJECTED,
        rejectionReason: 'Listing photos do not match the described property.',
        landlordId: 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f',
        updatedAt: '2026-08-21T10:15:30.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed — `status` must be one of `PENDING_REVIEW`, `APPROVED`, `REJECTED`',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer JWT' })
  @ApiResponse({ status: 403, description: 'Authenticated user is not an ADMIN' })
  @ApiResponse({ status: 404, description: 'Property listing not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePropertyStatusDto,
  ) {
    return this.propertiesService.updateStatus(id, updateStatusDto);
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
