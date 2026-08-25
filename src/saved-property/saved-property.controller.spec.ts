import { Test, TestingModule } from '@nestjs/testing';
import { SavedPropertyController } from './saved-property.controller';
import { SavedPropertyService } from './saved-property.service';

describe('SavedPropertyController', () => {
  let controller: SavedPropertyController;

  const mockSavedPropertyService = {
    saveProperty: jest.fn(),
    removeBookmark: jest.fn(),
    getSavedProperties: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedPropertyController],
      providers: [
        {
          provide: SavedPropertyService,
          useValue: mockSavedPropertyService,
        },
      ],
    }).compile();

    controller = module.get<SavedPropertyController>(
      SavedPropertyController
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
