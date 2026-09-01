import { Test, TestingModule } from '@nestjs/testing';
import { AdminPropertiesController } from './admin-properties.controller';
import { AdminPropertiesService } from './admin-properties.service';
import { Role } from '@/entities/enums';

describe('AdminPropertiesController', () => {
  let controller: AdminPropertiesController;
  const service = {
    getModerationQueue: jest.fn(),
    getModerationStats: jest.fn(),
    approveProperty: jest.fn(),
    rejectProperty: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPropertiesController],
      providers: [{ provide: AdminPropertiesService, useValue: service }],
    }).compile();

    controller = module.get<AdminPropertiesController>(AdminPropertiesController);
    jest.clearAllMocks();
  });

  it('delegates queue requests to the service', async () => {
    const query = { page: 1, limit: 10, search: 'Lekki' };
    const result = { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
    service.getModerationQueue.mockResolvedValue(result);

    await expect(controller.getModerationQueue(query as any, { user: { id: 'admin-1', role: Role.ADMIN } } as any)).resolves.toBe(result);
    expect(service.getModerationQueue).toHaveBeenCalledWith(query, 'admin-1');
  });

  it('delegates stats requests to the service', async () => {
    const result = { totalPending: 3, totalApproved: 2, totalRejected: 1 };
    service.getModerationStats.mockResolvedValue(result);

    await expect(controller.getModerationStats({ user: { id: 'admin-1', role: Role.ADMIN } } as any)).resolves.toBe(result);
    expect(service.getModerationStats).toHaveBeenCalledWith('admin-1');
  });

  it('delegates approve requests to the service', async () => {
    const result = { id: 'property-1', status: 'APPROVED' };
    service.approveProperty.mockResolvedValue(result);

    await expect(controller.approveProperty('property-1', { user: { id: 'admin-1', role: Role.ADMIN } } as any)).resolves.toBe(result);
    expect(service.approveProperty).toHaveBeenCalledWith('property-1', 'admin-1');
  });

  it('delegates reject requests to the service', async () => {
    const dto = { rejectionReason: 'Photos mismatched' };
    const result = { id: 'property-1', status: 'REJECTED', rejectionReason: 'Photos mismatched' };
    service.rejectProperty.mockResolvedValue(result);

    await expect(controller.rejectProperty('property-1', dto, { user: { id: 'admin-1', role: Role.ADMIN } } as any)).resolves.toBe(result);
    expect(service.rejectProperty).toHaveBeenCalledWith('property-1', dto, 'admin-1');
  });
});
