import { Test, TestingModule } from '@nestjs/testing';
import { CommandeMenuService } from './commande-menu.service';

describe('CommandeMenuService', () => {
  let service: CommandeMenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandeMenuService],
    }).compile();

    service = module.get<CommandeMenuService>(CommandeMenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
