import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../entities/enums';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get System Audit Logs (Admin)',
    description:
      'Fetches an immutable, paginated audit log trail of all administrative actions (property approvals, rejections, user suspensions, status changes). **Requires an ADMIN Bearer JWT.**',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of system audit logs',
    schema: {
      example: {
        items: [
          {
            id: '7b9c1d2e-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
            adminId: 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f',
            action: 'PROPERTY_APPROVED',
            targetType: 'PROPERTY',
            targetId: '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa',
            details: 'Listing approved and published to discovery feed.',
            metadata: { propertyTitle: '3 Bedroom Apartment, Lekki' },
            createdAt: '2026-09-01T10:00:00.000Z',
            admin: {
              id: 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f',
              firstName: 'Emeka',
              lastName: 'Okonkwo',
              email: 'admin@havenhub.com',
              role: 'ADMIN',
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
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer JWT' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not an ADMIN' })
  async findAll(@Query() queryDto: QueryAuditLogDto) {
    return this.auditLogService.findAll(queryDto);
  }
}
