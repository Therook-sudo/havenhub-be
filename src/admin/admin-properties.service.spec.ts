import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminPropertiesService } from './admin-properties.service';
import { Property } from '@/entities/Property.entity';
import { User } from '@/entities/User.entity';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { ListingStatus, AuditAction } from '@/entities/enums';

describe('AdminPropertiesService', () => {
  let service: AdminPropertiesService;
  const propertyRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const validPropertyId = '123e4567-e89b-12d3-a456-426614174000';
  const auditLogService = { logAction: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPropertiesService,
        { provide: getRepositoryToken(Property), useValue: propertyRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<AdminPropertiesService>(AdminPropertiesService);
    jest.clearAllMocks();
  });

  it('returns moderation queue entries with PENDING_REVIEW default status filter', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    propertyRepo.createQueryBuilder.mockReturnValue(qb);

    await service.getModerationQueue({ page: 1, limit: 10 }, 'admin-1');

    expect(qb.where).toHaveBeenCalledWith('property.status = :status', { status: ListingStatus.PENDING_REVIEW });
    expect(qb.getManyAndCount).toHaveBeenCalled();
  });

  it('returns moderation stats for pending, approved, and rejected totals', async () => {
    propertyRepo.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    await expect(service.getModerationStats('admin-1')).resolves.toEqual({
      totalPending: 4,
      totalApproved: 2,
      totalRejected: 1,
    });
  });

  it('approves a pending property and logs the audit action', async () => {
    const property = { id: validPropertyId, status: ListingStatus.PENDING_REVIEW, rejectionReason: 'Old reason' };
    propertyRepo.findOne.mockResolvedValue(property);
    propertyRepo.save.mockResolvedValue({ ...property, status: ListingStatus.APPROVED, rejectionReason: null });

    await expect(service.approveProperty(validPropertyId, 'admin-1')).resolves.toEqual({
      id: validPropertyId,
      status: ListingStatus.APPROVED,
      rejectionReason: null,
    });

    expect(propertyRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: ListingStatus.APPROVED,
      rejectionReason: null,
    }));
    expect(auditLogService.logAction).toHaveBeenCalledWith(
      'admin-1',
      AuditAction.PROPERTY_APPROVED,
      'PROPERTY',
      validPropertyId,
      'Listing approved by admin moderator.',
      { status: ListingStatus.APPROVED },
    );
  });

  it('rejects a property only with a valid reason', async () => {
    const property = { id: validPropertyId, status: ListingStatus.PENDING_REVIEW };
    propertyRepo.findOne
      .mockResolvedValueOnce(property)
      .mockResolvedValueOnce(null);
    propertyRepo.save.mockResolvedValue({ ...property, status: ListingStatus.REJECTED, rejectionReason: 'Bad photos' });

    await expect(service.rejectProperty(validPropertyId, { rejectionReason: 'Bad photos' }, 'admin-1')).resolves.toEqual({
      id: validPropertyId,
      status: ListingStatus.REJECTED,
      rejectionReason: 'Bad photos',
    });
    await expect(service.rejectProperty(validPropertyId, { rejectionReason: '   ' }, 'admin-1')).rejects.toThrow(BadRequestException);
    await expect(service.rejectProperty(validPropertyId, { rejectionReason: 'Bad photos' }, 'admin-1')).rejects.toThrow(NotFoundException);
  });
});
