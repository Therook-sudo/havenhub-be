import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditAction, AuditTargetType, Role } from '../entities/enums';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let service: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({
              items: [],
              meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            }),
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    service = module.get(AuditLogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/audit-logs', () => {
    it('delegates query DTO to AuditLogService.findAll', async () => {
      const query: QueryAuditLogDto = {
        page: 1,
        limit: 10,
        action: AuditAction.PROPERTY_APPROVED,
        targetType: AuditTargetType.PROPERTY,
      };

      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('is restricted to Role.ADMIN', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, AuditLogController);
      expect(roles).toEqual([Role.ADMIN]);
    });

    it('is protected by JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AuditLogController);
      expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    });
  });
});
