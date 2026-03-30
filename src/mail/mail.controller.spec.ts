import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

describe('MailController', () => {
  let controller: MailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'RESEND_API_KEY') return 're_test';
              if (key === 'RESEND_FROM') return 'Test Sender <test@example.com>';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
