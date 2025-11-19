import { Test, TestingModule } from '@nestjs/testing';
import { PaimentCommandeService } from './paiment-commande.service';

describe('PaimentCommandeService', () => {
  let service: PaimentCommandeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaimentCommandeService],
    }).compile();

    service = module.get<PaimentCommandeService>(PaimentCommandeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
