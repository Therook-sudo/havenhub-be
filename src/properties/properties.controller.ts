import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { QueryPropertyDto } from './dto/query-property.dto';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Public Property Discovery Feed',
    description:
      'Search and filter verified property listings with pagination. Accessible to Property Seekers, Landlords, and guest visitors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of property listings matching query criteria',
    schema: {
      example: {
        items: [
          {
            id: 'd9b2e7c1-4f3a-4b92-9c12-8e7d4a123456',
            title: 'Modern 3 Bedroom Apartment in Lekki Phase 1',
            description: 'Spacious luxury apartment with 24/7 power, swimming pool, and dedicated security.',
            price: 3500000,
            currency: 'NGN',
            location: 'Lekki Phase 1, Lagos',
            city: 'Lagos',
            state: 'Lagos State',
            propertyType: 'Apartment',
            bedrooms: 3,
            bathrooms: 3,
            amenities: ['24/7 Power', 'Swimming Pool', 'Security', 'Parking'],
            images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'],
            status: 'APPROVED',
            landlordId: 'u12345-landlord-id',
            landlord: {
              id: 'u12345-landlord-id',
              firstName: 'Emeka',
              lastName: 'Okonkwo',
              email: 'emeka@example.com',
              isVerified: true,
            },
            createdAt: '2026-08-16T08:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  async findAll(@Query() queryDto: QueryPropertyDto) {
    return this.propertiesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Detailed Property View',
    description: 'Fetch full listing details by Property ID including landlord profile and amenities.',
  })
  @ApiParam({ name: 'id', description: 'Unique Property UUID' })
  @ApiResponse({ status: 200, description: 'Property detail view' })
  @ApiResponse({ status: 404, description: 'Property listing not found' })
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }
}
