import { Test, TestingModule } from '@nestjs/testing';
import { PaimentReservationTableService } from './paiment-reservation-table.service';

describe('PaimentReservationTableService', () => {
  let service: PaimentReservationTableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaimentReservationTableService],
    }).compile();

    service = module.get<PaimentReservationTableService>(PaimentReservationTableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
