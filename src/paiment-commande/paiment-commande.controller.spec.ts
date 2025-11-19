import { Test, TestingModule } from '@nestjs/testing';
import { PaimentCommandeController } from './paiment-commande.controller';
import { PaimentCommandeService } from './paiment-commande.service';

describe('PaimentCommandeController', () => {
  let controller: PaimentCommandeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaimentCommandeController],
      providers: [PaimentCommandeService],
    }).compile();

    controller = module.get<PaimentCommandeController>(PaimentCommandeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
