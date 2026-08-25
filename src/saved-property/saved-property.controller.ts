import { Controller, Get, Post, Param, Delete, UseGuards } from '@nestjs/common';
import { SavedPropertyService } from './saved-property.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import {CurrentUser} from '@/auth/decorators/current-user.decorator';
import { Role } from '@/entities';


@Controller('saved-properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROPERTY_SEEKER)
export class SavedPropertyController {
  constructor(private readonly savedPropertyService: SavedPropertyService

  ) {}

  @Post('/:propertyId')
  async saveProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') userId: string,
  ){
    return this.savedPropertyService.saveProperty(
      propertyId,
      userId,
    );
  }
  
  @Delete('/:propertyId')
  async removeBookmark(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') userId: string,
  ){
    return this.savedPropertyService.removeBookmark(
      propertyId,
      userId
    );
  }
  
  @Get()
  async getSavedProperties(
    @CurrentUser('id') userId: string,
  ){
    return this.savedPropertyService.getSavedProperties(
      userId,
    );
  }
}
