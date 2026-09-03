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
import { Enquiry } from "../entities/Enquiry.entity";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

export interface UploadedPropertyFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly configService: ConfigService,
    @InjectRepository(Enquiry)
    private readonly enquiryRepository: Repository<Enquiry>,
    private readonly cloudinaryService: CloudinaryService,
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

    if (status) {
      queryBuilder.andWhere("property.status = :status", { status });
    } else if (!isDevAutoApproveEnabled(this.configService)) {
      queryBuilder.andWhere("property.status = :defaultStatus", {
        defaultStatus: ListingStatus.APPROVED,
      });
    }

    if (search && search.trim().length > 0) {
      const sanitized = search.trim();
      queryBuilder.andWhere(
        "(LOWER(property.title) LIKE LOWER(:search) OR LOWER(property.description) LIKE LOWER(:search) OR LOWER(property.city) LIKE LOWER(:search) OR LOWER(property.location) LIKE LOWER(:search) OR LOWER(property.state) LIKE LOWER(:search))",
        { search: `%${sanitized}%` },
      );
    }

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
      queryBuilder.andWhere(
        "(LOWER(property.location) LIKE LOWER(:loc) OR LOWER(property.city) LIKE LOWER(:loc) OR LOWER(property.state) LIKE LOWER(:loc))",
        { loc: `%${location.trim()}%` },
      );
    }

    if (propertyType && propertyType.trim().length > 0) {
      queryBuilder.andWhere("LOWER(property.propertyType) = LOWER(:pType)", {
        pType: propertyType.trim(),
      });
    }

    if (minPrice !== undefined && minPrice !== null) {
      queryBuilder.andWhere("property.price >= :minPrice", {
        minPrice: Number(minPrice),
      });
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      queryBuilder.andWhere("property.price <= :maxPrice", {
        maxPrice: Number(maxPrice),
      });
    }

    if (bedrooms !== undefined && bedrooms !== null) {
      queryBuilder.andWhere("property.bedrooms = :bedrooms", {
        bedrooms: Number(bedrooms),
      });
    }

    if (bathrooms !== undefined && bathrooms !== null) {
      queryBuilder.andWhere("property.bathrooms = :bathrooms", {
        bathrooms: Number(bathrooms),
      });
    }

    if (amenity && amenity.trim().length > 0) {
      queryBuilder.andWhere("property.amenities LIKE :amenity", {
        amenity: `%${amenity.trim()}%`,
      });
    }

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
    if (!UUID_REGEX.test(landlordId)) {
      throw new BadRequestException(
        `Invalid Landlord User UUID: "${landlordId}"`,
      );
    }
    return this.propertyRepository.find({
      where: { landlordId },
      order: { createdAt: "DESC" },
    });
  }

  async myListingsStats(id: string) {
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
          property: { id },
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
    files?: UploadedPropertyFile[],
    isDraft = false,
  ): Promise<Property> {
    const status = isDraft
      ? ListingStatus.DRAFT
      : resolveNewListingStatus(this.configService);

    const {
      rentPrice,
      floorNumber,
      squareFootage,
      latitude,
      longitude,
      ...sanitizedDto
    } = createPropertyDto as any;

    let uploadedImageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          if (this.cloudinaryService) {
            const url = await this.cloudinaryService.uploadImage(file);
            if (url) uploadedImageUrls.push(url);
          }
        } catch (err) {
          // Cloudinary fallback
        }
      }
    }

    const providedImages = Array.isArray(createPropertyDto.images)
      ? createPropertyDto.images
      : [];

    const combinedImages = [...providedImages, ...uploadedImageUrls];
    if (combinedImages.length === 0) {
      combinedImages.push(
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
      );
    }

    const property: Property = this.propertyRepository.create({
      title: createPropertyDto.title,
      description: createPropertyDto.description,
      price: createPropertyDto.price ?? createPropertyDto.rentPrice ?? rentPrice ?? 0,
      currency: createPropertyDto.currency || "NGN",
      location:
        createPropertyDto.location ||
        createPropertyDto.address ||
        createPropertyDto.city ||
        "Lagos",
      address: createPropertyDto.address,
      city: createPropertyDto.city || "Lagos",
      state: createPropertyDto.state || "Lagos State",
      propertyType: createPropertyDto.propertyType || "Apartment",
      bedrooms: createPropertyDto.bedrooms ?? 1,
      bathrooms: createPropertyDto.bathrooms ?? 1,
      amenities:
        createPropertyDto.amenities ||
        (createPropertyDto as any)["amenities[]"] ||
        [],
      images: combinedImages,
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

  async updateStatus(
    id: string,
    dto: UpdatePropertyStatusDto,
  ): Promise<Property> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid Property UUID: "${id}"`);
    }

    const property = await this.propertyRepository.findOne({ where: { id } });

    if (!property) {
      throw new NotFoundException(`Property with ID "${id}" was not found`);
    }

    property.status = dto.status;

    if (dto.status === ListingStatus.REJECTED) {
      property.rejectionReason = dto.rejectionReason ?? null;
    } else {
      property.rejectionReason = null;
    }

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
        "You are not authorized to delete this property",
      );
    }

    await this.propertyRepository.remove(property);
  }
}
