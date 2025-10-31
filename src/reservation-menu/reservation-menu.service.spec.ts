import { Test, TestingModule } from '@nestjs/testing';
import { ReservationMenuService } from './reservation-menu.service';

describe('ReservationMenuService', () => {
  let service: ReservationMenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservationMenuService],
    }).compile();

    service = module.get<ReservationMenuService>(ReservationMenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
