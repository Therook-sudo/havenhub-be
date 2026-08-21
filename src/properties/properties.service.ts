import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Property } from '../entities/Property.entity';
import { ListingStatus } from '../entities/enums';
import {
  isDevAutoApproveEnabled,
  resolveNewListingStatus,
} from '../config/feature-flags';
import { QueryPropertyDto } from './dto/query-property.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { CreatePropertyDto } from '../property/dto/create-property.dto';
import { UpdatePropertyDto } from '../property/dto/update-property.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly configService: ConfigService,
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

    if (status) {
      queryBuilder.andWhere('property.status = :status', { status });
    } else {
      if (!isDevAutoApproveEnabled(this.configService)) {
        queryBuilder.andWhere('property.status = :defaultStatus', {
          defaultStatus: ListingStatus.APPROVED,
        });
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(property.title) LIKE LOWER(:search) OR LOWER(property.description) LIKE LOWER(:search) OR LOWER(property.location) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

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

  async findMyListings(landlordId: string): Promise<Property[]> {
    if (!landlordId) {
      throw new BadRequestException('Landlord ID is required');
    }
    return this.propertyRepository.find({
      where: { landlordId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid Property UUID: "${id}"`);
    }

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

  async create(createPropertyDto: CreatePropertyDto, landlordId: string): Promise<Property> {
    // DEV_AUTO_APPROVE_LISTINGS=true -> APPROVED, otherwise PENDING_REVIEW.
    const status = resolveNewListingStatus(this.configService);

    const property = this.propertyRepository.create({
      ...createPropertyDto,
      landlordId,
      status,
    });
    return this.propertyRepository.save(property);
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, landlordId: string): Promise<Property> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid Property UUID: "${id}"`);
    }

    const property = await this.propertyRepository.findOne({ where: { id } });

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found`);
    }

    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('You are not authorized to update this property');
    }

    Object.assign(property, updatePropertyDto);
    return this.propertyRepository.save(property);
  }

  /**
   * Moderation transition for a listing (admin only at the controller layer).
   * `rejectionReason` is persisted only for REJECTED and cleared otherwise,
   * so an approved listing never carries a stale rejection message.
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdatePropertyStatusDto,
  ): Promise<Property> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid Property UUID: "${id}"`);
    }

    const property = await this.propertyRepository.findOne({ where: { id } });

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found`);
    }

    property.status = updateStatusDto.status;
    property.rejectionReason =
      updateStatusDto.status === ListingStatus.REJECTED
        ? updateStatusDto.rejectionReason ?? null
        : null;

    return this.propertyRepository.save(property);
  }

  async remove(id: string, landlordId: string): Promise<void> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid Property UUID: "${id}"`);
    }

    const property = await this.propertyRepository.findOne({ where: { id } });

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found`);
    }

    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('You are not authorized to remove this property');
    }

    await this.propertyRepository.remove(property);
  }
}
