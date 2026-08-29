import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SavedPropertyService } from './saved-property.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../entities/enums';

@ApiTags('Saved Properties')
@ApiBearerAuth('JWT-auth')
@Controller('saved-properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.PROPERTY_SEEKER,
  Role.LANDLORD,
  Role.REAL_ESTATE_AGENT,
  Role.PROPERTY_MANAGER,
  Role.ADMIN,
)
export class SavedPropertyController {
  constructor(private readonly savedPropertyService: SavedPropertyService) {}

  @Post(':propertyId')
  @ApiOperation({
    summary: 'Bookmark / Save a Property Listing',
    description: 'Allows an authenticated user to save a property listing to their bookmarks.',
  })
  @ApiParam({ name: 'propertyId', description: 'Unique Property UUID' })
  @ApiResponse({ status: 201, description: 'Property bookmarked successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 409, description: 'Property is already bookmarked' })
  async saveProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.savedPropertyService.saveProperty(userId, propertyId);
  }

  @Delete(':propertyId')
  @ApiOperation({
    summary: 'Remove Property Bookmark',
    description: 'Removes a bookmarked property from the user saved list.',
  })
  @ApiParam({ name: 'propertyId', description: 'Unique Property UUID' })
  @ApiResponse({ status: 200, description: 'Property bookmark removed successfully' })
  @ApiResponse({ status: 404, description: 'Property is not bookmarked' })
  async removeBookmark(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.savedPropertyService.removeBookmark(userId, propertyId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get My Saved Properties',
    description: 'Fetches all property listings bookmarked by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'List of saved property bookmarks' })
  async getSavedProperties(@CurrentUser('id') userId: string) {
    return this.savedPropertyService.getSavedProperties(userId);
  }
}
