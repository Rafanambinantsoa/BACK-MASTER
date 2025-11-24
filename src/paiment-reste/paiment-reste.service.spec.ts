import { Test, TestingModule } from '@nestjs/testing';
import { PaimentResteService } from './paiment-reste.service';

describe('PaimentResteService', () => {
  let service: PaimentResteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaimentResteService],
    }).compile();

    service = module.get<PaimentResteService>(PaimentResteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
