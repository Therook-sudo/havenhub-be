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

const asUser = (id: string, role: Role, firstName = 'User', lastName = 'Test'): User =>
  ({ id, role, firstName, lastName } as User);

describe('EnquiriesService', () => {
  let service: EnquiriesService;
  let enquiryRepository: jest.Mocked<Repository<Enquiry>>;
  let propertyRepository: jest.Mocked<Repository<Property>>;

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
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 2 }),
            }),
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
    propertyRepository = module.get(getRepositoryToken(Property));
    return built;
  };

  beforeEach(async () => {
    service = await buildService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('creates enquiry for a seeker and assigns seekerId to user.id', async () => {
      const seeker = asUser(SEEKER_ID, Role.PROPERTY_SEEKER);
      propertyRepository.findOne.mockResolvedValue({
        id: PROPERTY_ID,
        landlordId: LANDLORD_ID,
      } as Property);

      const result = await service.create(seeker, {
        propertyId: PROPERTY_ID,
        message: 'Is this apartment still available?',
      });

      expect(enquiryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: PROPERTY_ID,
          seekerId: SEEKER_ID,
          senderId: SEEKER_ID,
          senderRole: Role.PROPERTY_SEEKER,
          message: 'Is this apartment still available?',
        }),
      );
      expect(result.senderType).toBe('tenant');
    });

    it('creates reply for a landlord to an existing thread without corrupting seekerId', async () => {
      const landlord = asUser(LANDLORD_ID, Role.LANDLORD);
      enquiryRepository.findOne.mockResolvedValue({
        id: THREAD_ID,
        propertyId: PROPERTY_ID,
        seekerId: SEEKER_ID,
        property: { id: PROPERTY_ID, landlordId: LANDLORD_ID } as Property,
      } as Enquiry);

      const result = await service.create(landlord, {
        threadId: THREAD_ID,
        message: 'Yes, it is available for inspection tomorrow!',
      });

      expect(enquiryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: PROPERTY_ID,
          seekerId: SEEKER_ID,
          senderId: LANDLORD_ID,
          senderRole: Role.LANDLORD,
          message: 'Yes, it is available for inspection tomorrow!',
        }),
      );
      expect(result.senderType).toBe('landlord');
    });
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

  describe('markThreadsAsRead()', () => {
    it('marks a batch of thread IDs as read', async () => {
      const landlord = asUser(LANDLORD_ID, Role.LANDLORD);
      enquiryRepository.findOne.mockResolvedValue({
        id: THREAD_ID,
        propertyId: PROPERTY_ID,
        seekerId: SEEKER_ID,
        property: { landlordId: LANDLORD_ID },
      } as any);
      enquiryRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.markThreadsAsRead(landlord, {
        threadIds: [THREAD_ID],
      });

      expect(result.updatedCount).toBe(1);
    });
  });

  describe('deleteThread()', () => {
    it('permanently deletes conversation thread for owning landlord', async () => {
      const landlord = asUser(LANDLORD_ID, Role.LANDLORD);
      enquiryRepository.findOne.mockResolvedValue({
        id: THREAD_ID,
        propertyId: PROPERTY_ID,
        seekerId: SEEKER_ID,
        property: { landlordId: LANDLORD_ID },
      } as any);

      const result = await service.deleteThread(THREAD_ID, landlord);

      expect(enquiryRepository.delete).toHaveBeenCalledWith({
        propertyId: PROPERTY_ID,
        seekerId: SEEKER_ID,
      });
      expect(result.deletedCount).toBe(1);
    });
  });
});