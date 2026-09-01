import { Test, TestingModule } from '@nestjs/testing';
import { SavedPropertyController } from './saved-property.controller';
import { SavedPropertyService } from './saved-property.service';

const PROPERTY_ID = '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa';
const USER_ID = 'a1b2c3d4-e5f6-4711-8899-0a1b2c3d4e5f';

describe('SavedPropertyController', () => {
  let controller: SavedPropertyController;

  const mockSavedPropertyService = {
    saveProperty: jest.fn().mockResolvedValue({
      message: 'Property bookmarked successfully',
      savedProperty: { userId: USER_ID, propertyId: PROPERTY_ID },
    }),
    removeBookmark: jest.fn().mockResolvedValue({
      message: 'Property bookmark removed successfully',
    }),
    getSavedProperties: jest.fn().mockResolvedValue([]),
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
      SavedPropertyController,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /saved-properties/:propertyId', () => {
    it('calls service.saveProperty with (userId, propertyId)', async () => {
      await controller.saveProperty(PROPERTY_ID, USER_ID);
      expect(mockSavedPropertyService.saveProperty).toHaveBeenCalledWith(
        USER_ID,
        PROPERTY_ID,
      );
    });
  });

  describe('DELETE /saved-properties/:propertyId', () => {
    it('calls service.removeBookmark with (userId, propertyId)', async () => {
      await controller.removeBookmark(PROPERTY_ID, USER_ID);
      expect(mockSavedPropertyService.removeBookmark).toHaveBeenCalledWith(
        USER_ID,
        PROPERTY_ID,
      );
    });
  });

  describe('GET /saved-properties', () => {
    it('calls service.getSavedProperties with (userId)', async () => {
      await controller.getSavedProperties(USER_ID);
      expect(mockSavedPropertyService.getSavedProperties).toHaveBeenCalledWith(
        USER_ID,
      );
    });
  });
});
