import { Test, TestingModule } from '@nestjs/testing';
import { PaimentReservationTableController } from './paiment-reservation-table.controller';
import { PaimentReservationTableService } from './paiment-reservation-table.service';

describe('PaimentReservationTableController', () => {
  let controller: PaimentReservationTableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaimentReservationTableController],
      providers: [PaimentReservationTableService],
    }).compile();

    controller = module.get<PaimentReservationTableController>(PaimentReservationTableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
