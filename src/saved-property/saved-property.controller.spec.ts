import { Test, TestingModule } from '@nestjs/testing';
import { SavedPropertyController } from './saved-property.controller';
import { SavedPropertyService } from './saved-property.service';

describe('SavedPropertyController', () => {
  let controller: SavedPropertyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedPropertyController],
      providers: [SavedPropertyService],
    }).compile();

    controller = module.get<SavedPropertyController>(SavedPropertyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
