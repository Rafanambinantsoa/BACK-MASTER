import { Logger, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

const mailLogger = new Logger('MailModule');

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const smtpHost = config.get<string>('SMTP_HOST');
        const transport = smtpHost
          ? {
            host: smtpHost,
            port: config.get<number>('SMTP_PORT') ?? 587,
            secure: config.get<string>('SMTP_SECURE') === 'true',
            auth: {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            },
          }
          : { jsonTransport: true };

        if (!smtpHost) {
          mailLogger.warn(
            'SMTP non configuré (SMTP_HOST manquant dans .env) → aucun email réel ne sera envoyé. ' +
            'Définissez SMTP_HOST, SMTP_USER, SMTP_PASS pour envoyer de vrais emails.',
          );
        }

        return {
          transport,
          defaults: {
            from: config.get<string>('MAIL_FROM') ?? '"Restaurant OS" <no-reply@monapp.com>',
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule { }
