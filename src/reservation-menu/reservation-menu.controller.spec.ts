import { Test, TestingModule } from '@nestjs/testing';
import { ReservationMenuController } from './reservation-menu.controller';
import { ReservationMenuService } from './reservation-menu.service';

describe('ReservationMenuController', () => {
  let controller: ReservationMenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationMenuController],
      providers: [ReservationMenuService],
    }).compile();

    controller = module.get<ReservationMenuController>(ReservationMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
