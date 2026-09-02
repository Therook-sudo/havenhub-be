import { Roles } from "@/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { Role } from "../entities/enums";
import { Controller, Get, UseGuards, Body, Param, Patch, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { RolesGuard } from "@/auth/guards/roles.guard";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { FindAdminUserDto } from "./dto/find-admin-users.dto";
import { SuspendUserDto } from "./dto/suspend-user.dto";



@ApiTags('Admin')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("analytics/overview")
  @ApiOperation({
    summary: "Get Admin analytics overview",
    description:
      "Get users, properties and enquires analytics for admin usage.",
  })
  @ApiResponse({
    status: 200,
    description: "Analytics overview of users, properties and enquires",
  })
  @ApiResponse({ status: 400, description: "Missing user identification" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Tenants/Seekers cannot access landlord listings",
  })
  adminAnalytics() {
    return this.adminService.getAdminAnalytics();
  }

  // GET Endpoint for paginated list of platform users
  @Get('users')
  @ApiOperation({
    summary: 'List all platform users',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of platform users',
  })
  async getUsers(
    @Query() query: FindAdminUserDto,
  ) {
    return this.adminService.getUsers(query);
  }

  // PATCH endpoint for Suspend Account
  @Patch('users/:id/suspend')
  @ApiOperation({
    summary: 'Suspend account.',
  })
  @ApiResponse({
    status: 200,
    description: 'User account suspended successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User account is already suspended',
  })
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.suspendUser(
      id,
      dto.reason,
      adminId,
    );
  }

  // PATCH endpoint to Re-activate Suspended account
  @Patch('users/:id/activate')
  @ApiOperation({
    summary: 'Re-activate suspended account.',
  })
  @ApiResponse({
    status: 200,
    description: 'User account activated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User account is not suspended',
  })
  async activateUser(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ){
    return this.adminService.activateUser(
      id,
      adminId,
    );
  }


}
