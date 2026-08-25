import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SavedPropertyService } from './saved-property.service';
import { SavedProperty, Property } from '@/entities';
import { createQueryBuilder } from 'typeorm';


describe('SavedPropertyService', () => {
  let service: SavedPropertyService;

  const mockSavedPropertyRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPropertyRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedPropertyService,

        {
          provide: getRepositoryToken(SavedProperty),
          useValue: mockSavedPropertyRepository,
        },

        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertyRepository,
        },
      ],
    }).compile();

    service = module.get<SavedPropertyService>(
      SavedPropertyService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
