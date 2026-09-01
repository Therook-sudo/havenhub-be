import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Property } from '../entities/Property.entity';
import { PropertyService } from './property.service';
import { ListingStatus } from '../entities/enums';
import { DEV_AUTO_APPROVE_LISTINGS_PATH } from '../config/feature-flags';
import { CreatePropertyDto } from './dto/create-property.dto';

const LANDLORD_ID = 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f';

const createPropertyDto = (): CreatePropertyDto =>
  ({
    title: '2 Bedroom Flat, Yaba',
    description: 'Newly built flat close to the university.',
    price: 1800000,
    currency: 'NGN',
    location: 'Yaba',
    city: 'Yaba',
    state: 'Lagos',
    propertyType: 'Flat',
    bedrooms: 2,
    bathrooms: 2,
  }) as CreatePropertyDto;

describe('PropertyService', () => {
  const buildService = async (flagValue: unknown) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: getRepositoryToken(Property),
          useValue: {
            create: jest.fn((dto) => ({ ...dto }) as Property),
            save: jest.fn((entity) => Promise.resolve(entity as Property)),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === DEV_AUTO_APPROVE_LISTINGS_PATH ? flagValue : undefined,
            ),
          },
        },
      ],
    }).compile();

    return module.get<PropertyService>(PropertyService);
  };

  it('should be defined', async () => {
    await expect(buildService(false)).resolves.toBeDefined();
  });

  it('creates listings as APPROVED when DEV_AUTO_APPROVE_LISTINGS is true', async () => {
    const service = await buildService(true);

    const result = await service.create(createPropertyDto(), LANDLORD_ID);

    expect(result.status).toBe(ListingStatus.APPROVED);
  });

  it('creates listings as PENDING_REVIEW when DEV_AUTO_APPROVE_LISTINGS is false', async () => {
    const service = await buildService(false);

    const result = await service.create(createPropertyDto(), LANDLORD_ID);

    expect(result.status).toBe(ListingStatus.PENDING_REVIEW);
  });
});
