import { Controller, Get, Post, Body, Param, Delete, UseGuards,  BadRequestException, Put, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService} from '@/cloudinary/cloudinary.service'; 
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger'; 
import { UploadPropertyImagesDto } from './dto/upload-property-images.dto';


interface UploadedImage{
    buffer: Buffer;
    mimetype: string;
    originalname: string;
}


@Controller('/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService, 
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post()
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser('id') landlordId: string,
  ) {
    return this.propertyService.create(
      createPropertyDto, 
      landlordId,
    );

  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser('id') landlordId: string,
  ) {
    return this.propertyService.update(
      id,
      updatePropertyDto, 
      landlordId
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') landlordId: string,
  ) {
    await this.propertyService.remove(
      id,
      landlordId,
    );

    return {
      message: 'Property deleted successfully',
    };
  }

  @Get('my-listings')
  async findMyListings(
    @CurrentUser('id') landlordId: string,
  ) {
    return this.propertyService.findMyListings(
      landlordId,
    );
  }

  // Post Implementation for uploading property images
  @Post('upload-images')
  @ApiOperation({
    summary: 'Upload Property Images',
    description: 'Upload between 3 and 10 imgs for a property.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          minItems: 3,
          maxItems: 10,
        },
      },
      required: ['images'],  
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'At least 3 images are required or an invalid file was provided',
  })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        if(!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException(
              'Only image files are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImages(
    @UploadedFiles() files: UploadedImage[],
    @Body() uploadPropertyImagesDto: UploadPropertyImagesDto,
  ) {
      const uploadedUrls = files?.length
        ? await this.cloudinaryService.uploadImages(files.map((file) => file.buffer))
        : uploadPropertyImagesDto.fallbackUrls || [];

      const urls = [
        ...uploadedUrls,
        ...(uploadPropertyImagesDto.fallbackUrls ?? []),
      ];
      if (urls.length < 3) {
        throw new BadRequestException(
          'At least 3 images are required for a property listing',
        );
      }
      return {
        message: 'Images uploaded successfully',
        images: urls,
      };
    }

}
