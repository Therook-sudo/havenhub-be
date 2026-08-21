import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Property } from '@/entities';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { resolveNewListingStatus } from '@/config/feature-flags';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly configService: ConfigService,
  ) {}

 async create(
  createPropertyDto: CreatePropertyDto,
  landlordId: string,
): Promise<Property> {
    // DEV_AUTO_APPROVE_LISTINGS=true -> APPROVED, otherwise PENDING_REVIEW.
    const property = this.propertyRepository.create({
      ...createPropertyDto,
      landlordId,
      status: resolveNewListingStatus(this.configService),
    });
    return this.propertyRepository.save(property);
  }

  async update(
    id: string, 
    updatePropertyDto: UpdatePropertyDto,
    landlordId: string,
  ):Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: {
        id, 
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('You are not authorized to update this property');
    }

    Object.assign(property, updatePropertyDto);

    return this.propertyRepository.save(property);
  }

  async remove(id: string, landlordId: string): Promise<void> {
    const property = await this.propertyRepository.findOne({
      where: {
        id,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (property.landlordId !== landlordId) {
      throw new ForbiddenException('You are not authorized to remove this property');
    }

    await this.propertyRepository.remove(property);
  }

  findMyListings(landlordId: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: {
        landlordId,
      },
    });
  }

  // findOne(id: string) {
  //   return `This action returns a #${id} property`;
  // }


}
