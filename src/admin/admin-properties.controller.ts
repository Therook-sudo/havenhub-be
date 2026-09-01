import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Role, ListingStatus } from '@/entities/enums';
import { ModerationQueueQueryDto } from './dto/moderation-query.dto';
import { AdminPropertiesService } from './admin-properties.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPropertyDto {
  @ApiProperty({
    description: 'Mandatory reason for rejecting the listing',
    example: 'The listing photos do not match the property description.',
  })
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}

@ApiTags('Admin')
@Controller('admin/moderation/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminPropertiesController {
  constructor(private readonly adminPropertiesService: AdminPropertiesService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get moderation queue feed',
    description: 'Returns pending review listings with landlord summaries and pagination metadata.',
  })
  @ApiResponse({
    status: 200,
    description: 'Moderation queue returned successfully',
    schema: {
      example: {
        items: [
          {
            id: '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa',
            title: '3 Bedroom Apartment in Lekki',
            status: ListingStatus.PENDING_REVIEW,
            city: 'Lekki',
            state: 'Lagos',
            landlord: {
              id: 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f',
              firstName: 'Ada',
              lastName: 'Ikedi',
              email: 'ada@example.com',
              phoneNumber: '+2348123456789',
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  async getModerationQueue(
    @Query() query: ModerationQueueQueryDto,
    @Req() req: any,
  ) {
    return this.adminPropertiesService.getModerationQueue(query, req.user?.id || req.user?.sub);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get moderation queue statistics',
    description: 'Returns counts for pending, approved and rejected listings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Moderation statistics returned successfully',
    schema: {
      example: {
        totalPending: 12,
        totalApproved: 48,
        totalRejected: 9,
      },
    },
  })
  async getModerationStats(@Req() req: any) {
    return this.adminPropertiesService.getModerationStats(req.user?.id || req.user?.sub);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Approve a pending listing',
    description: 'Fast-track approval for a listing in moderation.',
  })
  @ApiParam({ name: 'id', description: 'Property UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Property approved successfully' })
  async approveProperty(@Param('id') id: string, @Req() req: any) {
    return this.adminPropertiesService.approveProperty(id, req.user?.id || req.user?.sub);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Reject a pending listing',
    description: 'Rejects a listing and stores the rejection reason for the landlord.',
  })
  @ApiParam({ name: 'id', description: 'Property UUID', format: 'uuid' })
  @ApiBody({ type: RejectPropertyDto })
  @ApiResponse({ status: 200, description: 'Property rejected successfully' })
  @ApiResponse({ status: 400, description: 'Rejection reason is required and cannot be empty' })
  async rejectProperty(
    @Param('id') id: string,
    @Body() rejectionDto: RejectPropertyDto,
    @Req() req: any,
  ) {
    return this.adminPropertiesService.rejectProperty(id, rejectionDto, req.user?.id || req.user?.sub);
  }
}
