import { Test, TestingModule } from '@nestjs/testing';
import { TypeMenuService } from './type_menu.service';

describe('TypeMenuService', () => {
  let service: TypeMenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeMenuService],
    }).compile();

    service = module.get<TypeMenuService>(TypeMenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
