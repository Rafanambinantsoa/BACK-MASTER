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
              if (key === 'SMTP_HOST') return 'smtp.gmail.com';
              if (key === 'SMTP_PORT') return '587';
              if (key === 'SMTP_USER') return 'test@example.com';
              if (key === 'SMTP_PASS') return 'test_pass';
              if (key === 'MAIL_FROM') return 'Test Sender <test@example.com>';
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
