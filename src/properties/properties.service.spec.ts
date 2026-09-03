import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PropertiesService } from './properties.service';
import { Property } from '../entities/Property.entity';
import { Enquiry } from '../entities/Enquiry.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AiService } from '../ai/ai.service';
import { ListingStatus } from '../entities/enums';
import { DEV_AUTO_APPROVE_LISTINGS_PATH } from '../config/feature-flags';
import { CreatePropertyDto } from '../property/dto/create-property.dto';

const PROPERTY_ID = '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa';
const LANDLORD_ID = 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f';

const createPropertyDto = (): CreatePropertyDto =>
  ({
    title: '3 Bedroom Serviced Apartment, Lekki Phase 1',
    description: 'Spacious serviced apartment with 24/7 power and security.',
    price: 4500000,
    currency: 'NGN',
    location: 'Lekki Phase 1',
    city: 'Lekki',
    state: 'Lagos',
    propertyType: 'Apartment',
    bedrooms: 3,
    bathrooms: 3,
  }) as CreatePropertyDto;

describe('PropertiesService', () => {
  let service: PropertiesService;
  let repository: jest.Mocked<Repository<Property>>;
  let configValues: Record<string, unknown>;

  const buildService = async (
    flagValue: unknown,
  ): Promise<PropertiesService> => {
    configValues = { [DEV_AUTO_APPROVE_LISTINGS_PATH]: flagValue };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getRepositoryToken(Property),
          useValue: {
            // `create` mirrors TypeORM: merge the partial into a new entity.
            create: jest.fn((dto) => ({ ...dto }) as Property),
            save: jest.fn((entity) => Promise.resolve(entity as Property)),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Enquiry),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => configValues[key]) },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest
              .fn()
              .mockResolvedValue('https://res.cloudinary.com/test/image.jpg'),
            uploadImages: jest
              .fn()
              .mockResolvedValue([
                'https://res.cloudinary.com/test/image.jpg',
              ]),
          },
        },
        {
          provide: AiService,
          useValue: {
            summarize: jest.fn().mockResolvedValue({
              success: true,
              highlights: ['Highlight 1', 'Highlight 2', 'Highlight 3'],
              fallback: false,
            }),
            generateDescription: jest.fn().mockResolvedValue({
              success: true,
              generatedDescription: 'AI generated description',
            }),
          },
        },
      ],
    }).compile();

    const built = module.get<PropertiesService>(PropertiesService);
    repository = module.get(getRepositoryToken(Property));
    return built;
  };

  it('should be defined', async () => {
    await expect(buildService(false)).resolves.toBeDefined();
  });

  describe('create() — DEV_AUTO_APPROVE_LISTINGS feature flag', () => {
    it('creates listings as APPROVED when the flag is true', async () => {
      service = await buildService(true);

      const result = await service.create(createPropertyDto(), LANDLORD_ID);

      expect(result.status).toBe(ListingStatus.APPROVED);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          landlordId: LANDLORD_ID,
          status: ListingStatus.APPROVED,
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ListingStatus.APPROVED }),
      );
    });

    it('creates listings as PENDING_REVIEW when the flag is false', async () => {
      service = await buildService(false);

      const result = await service.create(createPropertyDto(), LANDLORD_ID);

      expect(result.status).toBe(ListingStatus.PENDING_REVIEW);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ListingStatus.PENDING_REVIEW }),
      );
    });

    it('defaults to PENDING_REVIEW when the flag is not configured', async () => {
      service = await buildService(undefined);

      const result = await service.create(createPropertyDto(), LANDLORD_ID);

      expect(result.status).toBe(ListingStatus.PENDING_REVIEW);
    });

    it('never leaves the flag decision to the entity column default', async () => {
      service = await buildService(true);

      await service.create(createPropertyDto(), LANDLORD_ID);

      const [payload] = repository.create.mock.calls[0] as [Partial<Property>];
      expect(payload.status).toBeDefined();
    });
  });

  describe('findAll() — public feed visibility under the flag', () => {
    const mockQueryBuilder = () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn(() => qb),
        select: jest.fn(() => qb),
        andWhere: jest.fn(() => qb),
        orderBy: jest.fn(() => qb),
        skip: jest.fn(() => qb),
        take: jest.fn(() => qb),
        getManyAndCount: jest.fn(() => Promise.resolve([[], 0])),
      };
      return qb;
    };

    it('restricts the feed to APPROVED listings when the flag is false', async () => {
      service = await buildService(false);
      const qb = mockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({});

      expect(qb.andWhere).toHaveBeenCalledWith(
        'property.status = :defaultStatus',
        { defaultStatus: ListingStatus.APPROVED },
      );
    });

    it('does not filter by status when the flag is true', async () => {
      service = await buildService(true);
      const qb = mockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({});

      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'property.status = :defaultStatus',
        expect.anything(),
      );
    });
  });

  describe('updateStatus()', () => {
    const existingProperty = (overrides: Partial<Property> = {}): Property =>
      ({
        id: PROPERTY_ID,
        landlordId: LANDLORD_ID,
        status: ListingStatus.PENDING_REVIEW,
        rejectionReason: null,
        ...overrides,
      }) as Property;

    beforeEach(async () => {
      service = await buildService(false);
    });

    it.each([
      ListingStatus.PENDING_REVIEW,
      ListingStatus.APPROVED,
      ListingStatus.REJECTED,
    ])('moves a listing to %s', async (status) => {
      repository.findOne.mockResolvedValue(existingProperty());

      const result = await service.updateStatus(PROPERTY_ID, { status });

      expect(result.status).toBe(status);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status }),
      );
    });

    it('stores the rejection reason when rejecting', async () => {
      repository.findOne.mockResolvedValue(existingProperty());

      const result = await service.updateStatus(PROPERTY_ID, {
        status: ListingStatus.REJECTED,
        rejectionReason: 'Photos do not match the described property.',
      });

      expect(result.rejectionReason).toBe(
        'Photos do not match the described property.',
      );
    });

    it('clears a stale rejection reason when approving', async () => {
      repository.findOne.mockResolvedValue(
        existingProperty({
          status: ListingStatus.REJECTED,
          rejectionReason: 'Photos do not match the described property.',
        }),
      );

      const result = await service.updateStatus(PROPERTY_ID, {
        status: ListingStatus.APPROVED,
      });

      expect(result.rejectionReason).toBeNull();
    });

    it('rejects a malformed UUID with 404 before hitting the database', async () => {
      await expect(
        service.updateStatus('not-a-uuid', { status: ListingStatus.APPROVED }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('throws 404 when the listing does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(PROPERTY_ID, { status: ListingStatus.APPROVED }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
