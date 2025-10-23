import { Test, TestingModule } from '@nestjs/testing';
import { TypeMenuController } from './type_menu.controller';
import { TypeMenuService } from './type_menu.service';

describe('TypeMenuController', () => {
  let controller: TypeMenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeMenuController],
      providers: [TypeMenuService],
    }).compile();

    controller = module.get<TypeMenuController>(TypeMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
