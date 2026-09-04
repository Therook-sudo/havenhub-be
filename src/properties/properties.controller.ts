import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from "@nestjs/swagger";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { PropertiesService, UploadedPropertyFile } from "./properties.service";
import { QueryPropertyDto } from "./dto/query-property.dto";
import { UpdatePropertyStatusDto } from "./dto/update-property-status.dto";
import { CreatePropertyDto } from "../property/dto/create-property.dto";
import { UpdatePropertyDto } from "../property/dto/update-property.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role, ListingStatus } from "../entities/enums";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";

@ApiTags("Properties")
@Controller("properties")
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUser(
    req: Request,
    headerLandlordId?: string,
    requireLandlord = false,
  ): string {
    // 1. Check Bearer token in Authorization header
    const rawAuth = req.headers.authorization || "";
    let token = rawAuth.trim();
    while (token.toLowerCase().startsWith("bearer ")) {
      token = token.substring(7).trim();
    }

    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        if (payload && payload.sub) {
          if (requireLandlord && payload.role === Role.PROPERTY_SEEKER) {
            throw new ForbiddenException(
              "Tenants / Property Seekers are not permitted to manage property listings. Please register as a Landlord, Real Estate Agent, or Property Manager.",
            );
          }
          return payload.sub;
        }
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        // Fallback to x-user-id header if JWT verification fails or is expired in testing
      }
    }

    // 2. Fallback to x-user-id header
    if (headerLandlordId && headerLandlordId.trim().length > 0) {
      return headerLandlordId.trim();
    }

    throw new BadRequestException(
      "Authentication required. Provide a Bearer JWT token in the Authorization header.",
    );
  }

  @Get()
  @ApiOperation({
    summary: "Get All Property Listings (Discovery Feed)",
    description:
      "Primary endpoint for mobile and web clients to fetch all published property listings with pagination, landlord profiles, and sorting.",
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of property listings",
  })
  async findAll(@Query() queryDto: QueryPropertyDto) {
    return this.propertiesService.findAll(queryDto);
  }

  @Get("search")
  @ApiOperation({
    summary: "Dynamic Search & Multi-Filter Engine",
    description:
      "Search properties with multi-parameter filtering: keyword search, location/city/state, price ranges, bedrooms, bathrooms, amenities, and sorting.",
  })
  @ApiResponse({
    status: 200,
    description: "Search results matching criteria with pagination metadata",
  })
  async search(@Query() queryDto: QueryPropertyDto) {
    return this.propertiesService.search(queryDto);
  }

  @Get("my-listings")
  @ApiOperation({
    summary: "Get Landlord Listings",
    description:
      "Fetch property listings belonging to the authenticated Landlord or Agent.",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 200, description: "List of landlord properties" })
  @ApiResponse({ status: 400, description: "Missing user identification" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Tenants/Seekers cannot access landlord listings",
  })
  async findMyListings(
    @Req() req: Request,
    @Headers("x-user-id") headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId, true);
    return this.propertiesService.findMyListings(landlordId);
  }

  @Get("my-listings/stats")
  @ApiOperation({
    summary: "Get Landlord property statistics",
    description:
      "Fetch the landlord peoperty statistics like number of listings, active approved, pending reviews, rejected and total enquires.",
  })
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.REAL_ESTATE_AGENT,
    Role.PROPERTY_MANAGER,
    Role.LANDLORD,
    Role.ADMIN,
  )
  @ApiResponse({ status: 200, description: "statistics of landlord properties" })
  @ApiResponse({ status: 400, description: "Missing user identification" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Tenants/Seekers cannot access landlord listings",
  })
  async myListingsStats(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.propertiesService.myListingsStats(userId);
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: "Create New Property Listing",
    description:
      "Create a new property listing. Accepts JSON or multipart/form-data with image uploads under `photos` or `images`. **Authorized Roles**: `LANDLORD`, `REAL_ESTATE_AGENT`, `PROPERTY_MANAGER`, `ADMIN`.",
  })
  @ApiConsumes("multipart/form-data", "application/json")
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 201, description: "Property created successfully" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Tenants cannot create listings",
  })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files: Array<UploadedPropertyFile>,
    @Req() req: Request,
    @Headers("x-user-id") headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId, true);
    return this.propertiesService.create(createPropertyDto, landlordId, files, false);
  }

  @Post("drafts")
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: "Save Property Listing as Draft",
    description:
      "Save a property listing as draft. Accepts JSON or multipart/form-data.",
  })
  @ApiConsumes("multipart/form-data", "application/json")
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 201, description: "Property draft created successfully" })
  async createDraft(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files: Array<UploadedPropertyFile>,
    @Req() req: Request,
    @Headers("x-user-id") headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId, true);
    return this.propertiesService.create(createPropertyDto, landlordId, files, true);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Update Property Listing",
    description: "Update an existing property listing owned by the landlord.",
  })
  @ApiParam({ name: "id", description: "Unique Property UUID" })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 200, description: "Property updated successfully" })
  @ApiResponse({ status: 403, description: "Forbidden - Unauthorized user" })
  async update(
    @Param("id") id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: Request,
    @Headers("x-user-id") headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId, true);
    return this.propertiesService.update(id, updatePropertyDto, landlordId);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update Property Listing Status (Admin Moderation)",
    description:
      "Move a listing through the moderation workflow. **Requires an `ADMIN` Bearer JWT.**",
  })
  @ApiParam({ name: "id", format: "uuid", description: "Unique Property UUID" })
  @ApiBody({ type: UpdatePropertyStatusDto })
  @ApiResponse({
    status: 200,
    description: "Property status updated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid status or request data" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access only" })
  @ApiResponse({ status: 404, description: "Property not found" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updatePropertyStatusDto: UpdatePropertyStatusDto,
  ) {
    return this.propertiesService.updateStatus(id, updatePropertyStatusDto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get Single Property Listing Details",
    description:
      "Fetch complete property details by UUID, including amenities, images, and landlord info.",
  })
  @ApiParam({ name: "id", description: "Unique Property UUID" })
  @ApiResponse({
    status: 200,
    description: "Property details retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Property not found" })
  async findOne(@Param("id") id: string) {
    return this.propertiesService.findOne(id);
  }

  @Get(":id/ai-summary")
  @ApiOperation({
    summary: "Get AI Highlights Summary for Property (Mobile / Flutter)",
    description:
      "Fetches the property by UUID and generates/returns 3 key AI highlights directly via a single GET request.",
  })
  @ApiParam({ name: "id", description: "Unique Property UUID" })
  @ApiResponse({
    status: 200,
    description: "AI highlights summary retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Property not found" })
  async getAiSummary(@Param("id") id: string) {
    return this.propertiesService.getPropertyAiSummary(id);
  }

  @Get(":id/summary")
  @ApiOperation({
    summary: "Get AI Highlights Summary for Property (Alias)",
    description: "Alias for GET /properties/:id/ai-summary",
  })
  @ApiParam({ name: "id", description: "Unique Property UUID" })
  async getAiSummaryAlias(@Param("id") id: string) {
    return this.propertiesService.getPropertyAiSummary(id);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete Property Listing",
    description:
      "Permanently remove a property listing owned by the landlord.",
  })
  @ApiParam({ name: "id", description: "Unique Property UUID" })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({ status: 200, description: "Property deleted successfully" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Not authorized to delete this property",
  })
  @ApiResponse({ status: 404, description: "Property not found" })
  async remove(
    @Param("id") id: string,
    @Req() req: Request,
    @Headers("x-user-id") headerLandlordId?: string,
  ) {
    const landlordId = this.extractUser(req, headerLandlordId, true);
    await this.propertiesService.remove(id, landlordId);
    return { message: `Property with ID "${id}" has been deleted successfully.` };
  }
}
