import { Test, TestingModule } from '@nestjs/testing';
import { PaiementPretService } from './paiement-pret.service';

describe('PaiementPretService', () => {
  let service: PaiementPretService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaiementPretService],
    }).compile();

    service = module.get<PaiementPretService>(PaiementPretService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
