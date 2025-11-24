import { Test, TestingModule } from '@nestjs/testing';
import { PaiementPretController } from './paiement-pret.controller';
import { PaiementPretService } from './paiement-pret.service';

describe('PaiementPretController', () => {
  let controller: PaiementPretController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaiementPretController],
      providers: [PaiementPretService],
    }).compile();

    controller = module.get<PaiementPretController>(PaiementPretController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
