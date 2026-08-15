import { Controller, Get, Post, Body, Param, Delete, BadRequestException, Headers, Put } from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Request } from 'express';

@Controller('/properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService,) {}

  @Post()
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Headers('x-user-id') landlordId: string,

    // Once user authentication is created, we can use the @Request() decorator to access the authenticated user's ID from the request object. For now, we are using the x-user-id header to simulate this behavior.
    // @Request() req: Request,

  ) {
    // const landlordId = req.user['id'];

    // return this.propertyService.create(
    //   createPropertyDto, 
    //   landlordId,
    // );

    if (!landlordId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    return this.propertyService.create(
      createPropertyDto, landlordId,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Headers('x-user-id') landlordId: string,

    // @Request() req: Request,
  ) {
    // const landlordId = req.user['id'];
    // return this.propertyService.update(
    //   +id,
    //   updatePropertyDto, 
    //   landlordId
    // );

    if (!landlordId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    return this.propertyService.update(
      id,
      updatePropertyDto, 
      landlordId
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-user-id') landlordId: string,
    // @Request() req: Request,
  ) {
     // const landlordId = req.user['id'];
    // await this.propertyService.remove(
    //   +id,
    //   landlordId,
    // );

    // return {
    //   message: 'Property deleted successfully',
    // };

    if (!landlordId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    this.propertyService.remove(
      id,
      landlordId,
    );

    return {
      message: 'Property deleted successfully',
    };
  }

  @Get('my-listings')
  async findMyListings(
    @Headers('x-user-id') landlordId: string,
    // @Request() req: Request,
  ) {
    // const landlordId = req.user['id'];

    // return this

    if (!landlordId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    return this.propertyService.findMyListings(landlordId);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.propertyService.findOne(+id);
  // }


}
