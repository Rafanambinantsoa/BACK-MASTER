import { Test, TestingModule } from '@nestjs/testing';
import { PaimentResteController } from './paiment-reste.controller';
import { PaimentResteService } from './paiment-reste.service';

describe('PaimentResteController', () => {
  let controller: PaimentResteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaimentResteController],
      providers: [PaimentResteService],
    }).compile();

    controller = module.get<PaimentResteController>(PaimentResteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
