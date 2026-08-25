import { Test, TestingModule } from '@nestjs/testing';
import { SavedPropertyService } from './saved-property.service';

describe('SavedPropertyService', () => {
  let service: SavedPropertyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavedPropertyService],
    }).compile();

    service = module.get<SavedPropertyService>(SavedPropertyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
