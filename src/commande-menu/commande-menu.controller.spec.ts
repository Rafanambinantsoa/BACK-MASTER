import { Test, TestingModule } from '@nestjs/testing';
import { CommandeMenuController } from './commande-menu.controller';
import { CommandeMenuService } from './commande-menu.service';

describe('CommandeMenuController', () => {
  let controller: CommandeMenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommandeMenuController],
      providers: [CommandeMenuService],
    }).compile();

    controller = module.get<CommandeMenuController>(CommandeMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
