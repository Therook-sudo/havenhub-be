import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../entities/AuditLog.entity';
import { AuditAction, AuditTargetType } from '../entities/enums';

const ADMIN_ID = 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f';
const PROPERTY_ID = '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: jest.Mocked<Repository<AuditLog>>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn((dto) => ({ id: 'log-uuid-1', ...dto, createdAt: new Date() })),
            save: jest.fn((log) => Promise.resolve(log)),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get(getRepositoryToken(AuditLog));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('creates and saves an audit log entry', async () => {
      const result = await service.logAction(
        ADMIN_ID,
        AuditAction.PROPERTY_APPROVED,
        AuditTargetType.PROPERTY,
        PROPERTY_ID,
        'Listing approved by admin',
        { title: 'Test Flat' },
      );

      expect(repository.create).toHaveBeenCalledWith({
        adminId: ADMIN_ID,
        action: AuditAction.PROPERTY_APPROVED,
        targetType: AuditTargetType.PROPERTY,
        targetId: PROPERTY_ID,
        details: 'Listing approved by admin',
        metadata: { title: 'Test Flat' },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.adminId).toBe(ADMIN_ID);
      expect(result.action).toBe(AuditAction.PROPERTY_APPROVED);
    });
  });

  describe('findAll', () => {
    it('queries audit logs with pagination and filters', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'log-1',
            adminId: ADMIN_ID,
            action: AuditAction.PROPERTY_APPROVED,
            targetType: AuditTargetType.PROPERTY,
          } as AuditLog,
        ],
        1,
      ]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        action: AuditAction.PROPERTY_APPROVED,
        targetType: AuditTargetType.PROPERTY,
        search: 'approved',
      });

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('log');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
