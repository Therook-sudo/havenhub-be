import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../entities/Property.entity';
import { ListingStatus } from '../entities/enums';
import { QueryPropertyDto } from './dto/query-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async findAll(queryDto: QueryPropertyDto) {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      state,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      status,
    } = queryDto;

    const queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.landlord', 'landlord')
      .select([
        'property',
        'landlord.id',
        'landlord.firstName',
        'landlord.lastName',
        'landlord.email',
        'landlord.phoneNumber',
        'landlord.role',
        'landlord.isVerified',
        'landlord.avatarUrl',
      ]);

    // Status filtering: Defaults to APPROVED for public feed unless specified or in DEV_AUTO_APPROVE mode
    if (status) {
      queryBuilder.andWhere('property.status = :status', { status });
    } else {
      // If DEV_AUTO_APPROVE_LISTINGS is enabled, show all non-rejected properties
      const isDevAutoApprove = process.env.DEV_AUTO_APPROVE_LISTINGS === 'true';
      if (!isDevAutoApprove) {
        queryBuilder.andWhere('property.status = :defaultStatus', {
          defaultStatus: ListingStatus.APPROVED,
        });
      }
    }

    // Keyword Search across title, description, and location
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(property.title) LIKE LOWER(:search) OR LOWER(property.description) LIKE LOWER(:search) OR LOWER(property.location) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Specific filters
    if (city) {
      queryBuilder.andWhere('LOWER(property.city) = LOWER(:city)', { city });
    }

    if (state) {
      queryBuilder.andWhere('LOWER(property.state) = LOWER(:state)', { state });
    }

    if (propertyType) {
      queryBuilder.andWhere('LOWER(property.propertyType) = LOWER(:propertyType)', {
        propertyType,
      });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('property.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('property.price <= :maxPrice', { maxPrice });
    }

    if (bedrooms !== undefined) {
      queryBuilder.andWhere('property.bedrooms = :bedrooms', { bedrooms });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.orderBy('property.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const property = await this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.landlord', 'landlord')
      .select([
        'property',
        'landlord.id',
        'landlord.firstName',
        'landlord.lastName',
        'landlord.email',
        'landlord.phoneNumber',
        'landlord.role',
        'landlord.isVerified',
        'landlord.avatarUrl',
      ])
      .where('property.id = :id', { id })
      .getOne();

    if (!property) {
      throw new NotFoundException(`Property listing with ID "${id}" was not found.`);
    }

    return property;
  }
}
