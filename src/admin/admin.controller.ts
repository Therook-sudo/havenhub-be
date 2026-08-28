import { Roles } from "@/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { Role } from "../entities/enums";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { RolesGuard } from "@/auth/guards/roles.guard";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Admin')
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("analytics/overview")
  @ApiOperation({
    summary: "Get Admin analytics overview",
    description:
      "Get users, properties and enquires analytics for admin usage.",
  })
  @ApiBearerAuth("JWT-auth")
  @ApiResponse({
    status: 200,
    description: "Analytics overview of users, properties and enquires",
  })
  @ApiResponse({ status: 400, description: "Missing user identification" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Tenants/Seekers cannot access landlord listings",
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminAnalytics() {
    return this.adminService.getAdminAnalytics();
  }
}
