import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { Property } from "../entities/Property.entity";
import { ListingStatus } from "../entities/enums";
import {
  isDevAutoApproveEnabled,
  resolveNewListingStatus,
} from "../config/feature-flags";
import { QueryPropertyDto, PropertySortBy } from "./dto/query-property.dto";
import { UpdatePropertyStatusDto } from "./dto/update-property-status.dto";
import { CreatePropertyDto } from "../property/dto/create-property.dto";
import { UpdatePropertyDto } from "../property/dto/update-property.dto";
import { Enquiry } from "@/entities";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly configService: ConfigService,
    @InjectRepository(Enquiry)
    private readonly enquiryRepository: Repository<Enquiry>
  ) {}

  async findAll(queryDto: QueryPropertyDto) {
    return this.executePropertyQuery(queryDto);
  }

  async search(queryDto: QueryPropertyDto) {
    return this.executePropertyQuery(queryDto);
  }

  private async executePropertyQuery(queryDto: QueryPropertyDto) {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      state,
      location,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      amenity,
      sortBy = PropertySortBy.NEWEST,
      status,
    } = queryDto;

    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.landlord", "landlord")
      .select([
        "property",
        "landlord.id",
        "landlord.firstName",
        "landlord.lastName",
        "landlord.email",
        "landlord.phoneNumber",
        "landlord.role",
        "landlord.isVerified",
        "landlord.avatarUrl",
      ]);

    // 1. Status Filtering
    if (status) {
      queryBuilder.andWhere("property.status = :status", { status });
    } else {
      if (!isDevAutoApproveEnabled(this.configService)) {
        queryBuilder.andWhere("property.status = :defaultStatus", {
          defaultStatus: ListingStatus.APPROVED,
        });
      }
    }

    // 2. Multi-field Keyword Search
    if (search && search.trim().length > 0) {
      const searchTerms = `%${search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        "(LOWER(property.title) LIKE :searchTerms OR LOWER(property.description) LIKE :searchTerms OR LOWER(property.location) LIKE :searchTerms OR LOWER(property.city) LIKE :searchTerms OR LOWER(COALESCE(property.address, '')) LIKE :searchTerms)",
        { searchTerms },
      );
    }

    // 3. Location Filters
    if (city && city.trim().length > 0) {
      queryBuilder.andWhere("LOWER(property.city) = LOWER(:city)", {
        city: city.trim(),
      });
    }

    if (state && state.trim().length > 0) {
      queryBuilder.andWhere("LOWER(property.state) = LOWER(:state)", {
        state: state.trim(),
      });
    }

    if (location && location.trim().length > 0) {
      queryBuilder.andWhere("LOWER(property.location) LIKE LOWER(:location)", {
        location: `%${location.trim()}%`,
      });
    }

    // 4. Property Type Filter
    if (propertyType && propertyType.trim().length > 0) {
      queryBuilder.andWhere(
        "LOWER(property.propertyType) = LOWER(:propertyType)",
        {
          propertyType: propertyType.trim(),
        },
      );
    }

    // 5. Price Range Filter
    if (minPrice !== undefined && minPrice !== null) {
      queryBuilder.andWhere("property.price >= :minPrice", { minPrice });
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      queryBuilder.andWhere("property.price <= :maxPrice", { maxPrice });
    }

    // 6. Bedroom & Bathroom Filters
    if (bedrooms !== undefined && bedrooms !== null) {
      queryBuilder.andWhere("property.bedrooms >= :bedrooms", { bedrooms });
    }

    if (bathrooms !== undefined && bathrooms !== null) {
      queryBuilder.andWhere("property.bathrooms >= :bathrooms", { bathrooms });
    }

    // 7. Amenity Filter
    if (amenity && amenity.trim().length > 0) {
      queryBuilder.andWhere(
        "LOWER(COALESCE(property.amenities, '')) LIKE LOWER(:amenity)",
        {
          amenity: `%${amenity.trim()}%`,
        },
      );
    }

    // 8. Sorting
    switch (sortBy) {
      case PropertySortBy.PRICE_ASC:
        queryBuilder.orderBy("property.price", "ASC");
        break;
      case PropertySortBy.PRICE_DESC:
        queryBuilder.orderBy("property.price", "DESC");
        break;
      case PropertySortBy.OLDEST:
        queryBuilder.orderBy("property.createdAt", "ASC");
        break;
      case PropertySortBy.NEWEST:
      default:
        queryBuilder.orderBy("property.createdAt", "DESC");
        break;
    }

    // 9. Pagination
    const validLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const validPage = Math.max(Number(page) || 1, 1);
    const skip = (validPage - 1) * validLimit;

    queryBuilder.skip(skip).take(validLimit);

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / validLimit) || 1;

    return {
      items,
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

  async findMyListings(landlordId: string): Promise<Property[]> {
    if (!landlordId) {
      throw new BadRequestException("Landlord ID is required");
    }
    if (!UUID_REGEX.test(landlordId)) {
      throw new BadRequestException(
        `Invalid Landlord ID format: "${landlordId}". Must be a valid UUID.`,
      );
    }
    return this.propertyRepository.find({
      where: { landlordId },
      order: { createdAt: "DESC" },
    });
  }

  async myListingsStats(id) {
    const [
      totalListings,
      activeApproved,
      pendingReviews,
      rejected,
      totalEnquires,
    ] = await Promise.all([
      this.propertyRepository.count({
        where: {
          landlordId: id,
        },
      }),
      this.propertyRepository.count({
        where: {
          landlordId: id,
          status: ListingStatus.APPROVED,
        },
      }),
      this.propertyRepository.count({
        where: {
          landlordId: id,
          status: ListingStatus.PENDING_REVIEW,
        },
      }),
      this.propertyRepository.count({
        where: {
          landlordId: id,
          status: ListingStatus.REJECTED,
        },
      }),
      this.enquiryRepository.count({
        where: {
          property: {id},
        },
      }),
    ]);

    return {
      totalListings,
      activeApproved,
      pendingReviews,
      rejected,
      totalEnquires,
    };
  }

  async findOne(id: string) {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid Property UUID: "${id}"`);
    }

    const property = await this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.landlord", "landlord")
      .select([
        "property",
        "landlord.id",
        "landlord.firstName",
        "landlord.lastName",
        "landlord.email",
        "landlord.phoneNumber",
        "landlord.role",
        "landlord.isVerified",
        "landlord.avatarUrl",
      ])
      .where("property.id = :id", { id })
      .getOne();

    if (!property) {
      throw new NotFoundException(
        `Property listing with ID "${id}" was not found.`,
      );
    }

    return property;
  }

  async create(
    createPropertyDto: CreatePropertyDto,
    landlordId: string,
  ): Promise<Property> {
    // DEV_AUTO_APPROVE_LISTINGS=true -> APPROVED, otherwise PENDING_REVIEW.
    const status = resolveNewListingStatus(this.configService);

    const property = this.propertyRepository.create({
      ...createPropertyDto,
      landlordId,
      status,
    });
    return this.propertyRepository.save(property);
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    landlordId: string,
  ): Promise<Property> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid Property UUID: "${id}"`);
    }

    const property = await this.propertyRepository.findOne({ where: { id } });

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found`);
    }

    if (property.landlordId !== landlordId) {
      throw new ForbiddenException(
        "You are not authorized to update this property",
      );
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
        ? (updateStatusDto.rejectionReason ?? null)
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
      throw new ForbiddenException(
        "You are not authorized to remove this property",
      );
    }

    await this.propertyRepository.remove(property);
  }
}
