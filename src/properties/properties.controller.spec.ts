import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { QueryPropertyDto, PropertySortBy } from './dto/query-property.dto';
import {
  MODERATION_STATUSES,
  UpdatePropertyStatusDto,
} from './dto/update-property-status.dto';
import { ListingStatus, Role } from '../entities/enums';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const PROPERTY_ID = '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let service: jest.Mocked<PropertiesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        {
          provide: PropertiesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ items: [], meta: {} }),
            search: jest.fn().mockResolvedValue({ items: [], meta: {} }),
            findOne: jest.fn(),
            findMyListings: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn((id, dto) =>
              Promise.resolve({ id, ...dto }),
            ),
            remove: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
    service = module.get(PropertiesService) as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /properties/search', () => {
    it('delegates query DTO to PropertiesService.search', async () => {
      const query: QueryPropertyDto = {
        search: 'Lekki',
        city: 'Lagos',
        minPrice: 100000,
        maxPrice: 500000,
        sortBy: PropertySortBy.PRICE_ASC,
        page: 1,
        limit: 10,
      };

      await controller.search(query);
      expect(service.search).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /properties', () => {
    it('delegates query DTO to PropertiesService.findAll', async () => {
      const query: QueryPropertyDto = { page: 1, limit: 10 };
      await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('PATCH /properties/:id/status', () => {
    it('delegates the id and body to PropertiesService.updateStatus', async () => {
      const dto: UpdatePropertyStatusDto = {
        status: ListingStatus.APPROVED,
      };

      const result = await controller.updateStatus(PROPERTY_ID, dto);

      expect(service.updateStatus).toHaveBeenCalledWith(PROPERTY_ID, dto);
      expect(result).toEqual({ id: PROPERTY_ID, status: ListingStatus.APPROVED });
    });

    it('is restricted to ADMIN via @Roles metadata', () => {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        PropertiesController.prototype.updateStatus,
      );
      expect(roles).toEqual([Role.ADMIN]);
    });

    it('is protected by JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        PropertiesController.prototype.updateStatus,
      );
      expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    });
  });

  describe('UpdatePropertyStatusDto validation', () => {
    const validateDto = (payload: Record<string, unknown>) =>
      validate(plainToInstance(UpdatePropertyStatusDto, payload));

    it.each(MODERATION_STATUSES)('accepts %s', async (status) => {
      await expect(validateDto({ status })).resolves.toHaveLength(0);
    });

    it.each([ListingStatus.DRAFT, ListingStatus.RENTED])(
      'rejects the non-moderation status %s',
      async (status) => {
        const errors = await validateDto({ status });
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('status');
      },
    );

    it.each([undefined, '', 'approved', 'NOT_A_STATUS', 42])(
      'rejects the invalid status %p',
      async (status) => {
        const errors = await validateDto({ status });
        expect(errors.length).toBeGreaterThan(0);
      },
    );

    it('accepts an optional rejectionReason', async () => {
      await expect(
        validateDto({
          status: ListingStatus.REJECTED,
          rejectionReason: 'Photos do not match the described property.',
        }),
      ).resolves.toHaveLength(0);
    });

    it('rejects a rejectionReason longer than 500 characters', async () => {
      const errors = await validateDto({
        status: ListingStatus.REJECTED,
        rejectionReason: 'x'.repeat(501),
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rejectionReason');
    });

    it('strips unknown properties under the global ValidationPipe', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });

      await expect(
        pipe.transform(
          { status: ListingStatus.APPROVED, landlordId: 'spoofed' },
          { type: 'body', metatype: UpdatePropertyStatusDto },
        ),
      ).rejects.toThrow();
    });
  });
});
