import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EnquiriesService } from './enquiries.service';
import { Enquiry } from '../entities/Enquiry.entity';
import { Property } from '../entities/Property.entity';
import { Role } from '../entities/enums';
import { User } from '../entities/User.entity';

const LANDLORD_ID = 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f';
const SEEKER_ID = 'b2c3d4e5-f6a7-4822-9900-1b2c3d4e5f6a';
const OUTSIDER_ID = 'c3d4e5f6-a7b8-4933-a011-2c3d4e5f6a7b';
const THREAD_ID = '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa';
const PROPERTY_ID = 'd4e5f6a7-b8c9-4a44-b122-3d4e5f6a7b8c';

const asUser = (id: string, role: Role): User =>
  ({ id, role }) as User;

describe('EnquiriesService', () => {
  let service: EnquiriesService;
  let enquiryRepository: jest.Mocked<Repository<Enquiry>>;

  const buildService = async (): Promise<EnquiriesService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnquiriesService,
        {
          provide: getRepositoryToken(Enquiry),
          useValue: {
            create: jest.fn((dto) => ({ ...dto }) as Enquiry),
            save: jest.fn((entity) => Promise.resolve(entity as Enquiry)),
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Property),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    const built = module.get<EnquiriesService>(EnquiriesService);
    enquiryRepository = module.get(getRepositoryToken(Enquiry));
    return built;
  };

  beforeEach(async () => {
    service = await buildService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUnreadCount()', () => {
    it('returns 0 for a non-landlord without querying the repository', async () => {
      const seeker = asUser(SEEKER_ID, Role.PROPERTY_SEEKER);

      const result = await service.getUnreadCount(seeker);

      expect(result).toEqual({ unreadCount: 0 });
      expect(enquiryRepository.count).not.toHaveBeenCalled();
    });

    it('returns the repository count for a landlord', async () => {
      const landlord = asUser(LANDLORD_ID, Role.LANDLORD);
      enquiryRepository.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(landlord);

      expect(result).toEqual({ unreadCount: 3 });
      expect(enquiryRepository.count).toHaveBeenCalledWith({
        where: {
          property: { landlordId: LANDLORD_ID },
          isRead: false,
          isArchived: false,
        },
      });
    });
  });

  describe('markThreadAsRead()', () => {
    const rootEnquiry = (overrides: Partial<Enquiry> = {}): Enquiry =>
      ({
        id: THREAD_ID,
        propertyId: PROPERTY_ID,
        seekerId: SEEKER_ID,
        property: { landlordId: LANDLORD_ID },
        ...overrides,
      }) as Enquiry;

    it('throws 404 when the thread does not exist', async () => {
      enquiryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.markThreadAsRead(
          asUser(LANDLORD_ID, Role.LANDLORD),
          THREAD_ID,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(enquiryRepository.update).not.toHaveBeenCalled();
    });

    it('throws 403 for a user who is neither the seeker nor the landlord', async () => {
      enquiryRepository.findOne.mockResolvedValue(rootEnquiry());

      await expect(
        service.markThreadAsRead(
          asUser(OUTSIDER_ID, Role.PROPERTY_SEEKER),
          THREAD_ID,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(enquiryRepository.update).not.toHaveBeenCalled();
    });

    it('marks the thread as read for the owning landlord', async () => {
      enquiryRepository.findOne.mockResolvedValue(rootEnquiry());
      enquiryRepository.update.mockResolvedValue({ affected: 2 } as any);

      const result = await service.markThreadAsRead(
        asUser(LANDLORD_ID, Role.LANDLORD),
        THREAD_ID,
      );

      expect(result).toEqual({
        message: 'Thread marked as read',
        updatedCount: 2,
      });
      expect(enquiryRepository.update).toHaveBeenCalledWith(
        { propertyId: PROPERTY_ID, seekerId: SEEKER_ID, isRead: false },
        expect.objectContaining({ isRead: true }),
      );
    });

    it('marks the thread as read for the owning seeker', async () => {
      enquiryRepository.findOne.mockResolvedValue(rootEnquiry());
      enquiryRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.markThreadAsRead(
        asUser(SEEKER_ID, Role.PROPERTY_SEEKER),
        THREAD_ID,
      );

      expect(result.updatedCount).toBe(1);
    });

    it('returns 0 updatedCount when nothing was unread', async () => {
      enquiryRepository.findOne.mockResolvedValue(rootEnquiry());
      enquiryRepository.update.mockResolvedValue({ affected: 0 } as any);

      const result = await service.markThreadAsRead(
        asUser(LANDLORD_ID, Role.LANDLORD),
        THREAD_ID,
      );

      expect(result.updatedCount).toBe(0);
    });

    it('sets readAt on the update payload', async () => {
      enquiryRepository.findOne.mockResolvedValue(rootEnquiry());
      enquiryRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.markThreadAsRead(
        asUser(LANDLORD_ID, Role.LANDLORD),
        THREAD_ID,
      );

      const [, payload] = enquiryRepository.update.mock.calls[0] as [
        unknown,
        Partial<Enquiry>,
      ];
      expect(payload.readAt).toBeInstanceOf(Date);
    });
  });
});