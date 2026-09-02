import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { Property } from '@/entities/Property.entity';
import { User } from '@/entities/User.entity';
import { AuditAction, ListingStatus } from '@/entities/enums';
import { ModerationQueueQueryDto } from './dto/moderation-query.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AdminPropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getModerationQueue(query: ModerationQueueQueryDto, adminId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      state,
      landlordId,
    } = query;

    const queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.landlord', 'landlord')
      .select([
        'property.id',
        'property.title',
        'property.description',
        'property.city',
        'property.state',
        'property.status',
        'property.createdAt',
        'property.updatedAt',
        'property.landlordId',
        'landlord.id',
        'landlord.firstName',
        'landlord.lastName',
        'landlord.email',
        'landlord.phoneNumber',
      ])
      .where('property.status = :status', { status: ListingStatus.PENDING_REVIEW });

    if (search && search.trim().length > 0) {
      queryBuilder.andWhere(
        '(LOWER(property.title) LIKE LOWER(:search) OR LOWER(COALESCE(property.description, \'\')) LIKE LOWER(:search) OR LOWER(COALESCE(property.city, \'\')) LIKE LOWER(:search) OR LOWER(COALESCE(property.state, \'\')) LIKE LOWER(:search) OR LOWER(COALESCE(property.address, \'\')) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` },
      );
    }

    if (city && city.trim().length > 0) {
      queryBuilder.andWhere('LOWER(property.city) = LOWER(:city)', { city: city.trim() });
    }

    if (state && state.trim().length > 0) {
      queryBuilder.andWhere('LOWER(property.state) = LOWER(:state)', { state: state.trim() });
    }

    if (landlordId && landlordId.trim().length > 0) {
      queryBuilder.andWhere('property.landlordId = :landlordId', { landlordId: landlordId.trim() });
    }

    const validLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const validPage = Math.max(Number(page) || 1, 1);
    const skip = (validPage - 1) * validLimit;

    queryBuilder.orderBy('property.createdAt', 'DESC').skip(skip).take(validLimit);

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / validLimit) || 1;

    return {
      items: items.map((property: any) => ({
        ...property,
        landlord: property.landlord
          ? {
              id: property.landlord.id,
              firstName: property.landlord.firstName,
              lastName: property.landlord.lastName,
              email: property.landlord.email,
              phoneNumber: property.landlord.phoneNumber,
            }
          : null,
      })),
      meta: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPreviousPage: validPage > 1,
      },
    };
  }

  async getModerationStats(adminId?: string) {
    const [totalPending, totalApproved, totalRejected] = await Promise.all([
      this.propertyRepository.count({ where: { status: ListingStatus.PENDING_REVIEW } }),
      this.propertyRepository.count({ where: { status: ListingStatus.APPROVED } }),
      this.propertyRepository.count({ where: { status: ListingStatus.REJECTED } }),
    ]);

    return { totalPending, totalApproved, totalRejected };
  }

  async approveProperty(id: string, adminId?: string) {
    const property = await this.getPropertyOrThrow(id);
    property.status = ListingStatus.APPROVED;
    property.rejectionReason = null;

    const updated = await this.propertyRepository.save(property);

    if (adminId) {
      await this.auditLogService.logAction(
        adminId,
        AuditAction.PROPERTY_APPROVED,
        'PROPERTY',
        updated.id,
        'Listing approved by admin moderator.',
        { status: ListingStatus.APPROVED },
      );
    }

    return updated;
  }

  async rejectProperty(id: string, dto: { rejectionReason: string }, adminId?: string) {
    const reason = dto?.rejectionReason?.trim();
    if (!reason || reason.length === 0) {
      throw new BadRequestException('rejectionReason is required and cannot be empty.');
    }

    const property = await this.getPropertyOrThrow(id);
    property.status = ListingStatus.REJECTED;
    property.rejectionReason = reason;

    const updated = await this.propertyRepository.save(property);

    if (adminId) {
      await this.auditLogService.logAction(
        adminId,
        AuditAction.PROPERTY_REJECTED,
        'PROPERTY',
        updated.id,
        `Listing rejected by admin moderator. Reason: ${reason}`,
        { status: ListingStatus.REJECTED, rejectionReason: reason },
      );
    }

    return updated;
  }

  private async getPropertyOrThrow(id: string) {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Property with ID "${id}" was not found`);
    }

    const property = await this.propertyRepository.findOne({ where: { id } });
    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found`);
    }

    return property;
  }
}
