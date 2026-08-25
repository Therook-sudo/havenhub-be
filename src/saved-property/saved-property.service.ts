import { Injectable, ConflictException, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedProperty, Property } from '@/entities';


@Injectable()
export class SavedPropertyService {
  constructor(
    @InjectRepository(SavedProperty)
    private readonly savedPropertyRepository: Repository<SavedProperty>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async saveProperty(userId: string, propertyId: string) {
    // Make sure the property exists
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        'Property not found'
      );
    }

    //Prevent duplicate saves
    const existingSavedProperty = 
    await this.savedPropertyRepository.findOne({
      where: { userId, propertyId },
    });

    if (existingSavedProperty) {
      throw new ConflictException(
        'Property is already bookmarked'
      );
    }

    //Create bookmrk
    const savedProperty = this.savedPropertyRepository.create({
      userId,
      propertyId,
    });

    const saved =
    await this.savedPropertyRepository.save(
      savedProperty
    );

    return{
      message: 'Property bookmarked successfully',
      savedProperty: saved,
    };
  
  }

  async removeBookmark(
    userId: string, 
    propertyId: string
  ) {
    const savedProperty = 
    await this.savedPropertyRepository.findOne({
      where: { userId, propertyId },
    });

    if (!savedProperty) {
      throw new NotFoundException(
        'Property is not bookmarked'
      );
    }

    await this.savedPropertyRepository.remove(savedProperty);
    return{
      message: 'Property bookmark removed successfully',
    };
  }
  
  async getSavedProperties(userId: string) {
    const savedProperties = 
    await this.savedPropertyRepository.find({
      where: { userId },
      relations: {
        property: {
          landlord: true,
        },
      },
      order:{
        createdAt: 'DESC',
      },
    });

    return savedProperties
  }

}
