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
        const smtpPort = config.get<number>('SMTP_PORT') ?? 587;
        const smtpUser = config.get<string>('SMTP_USER');
        const smtpPass = config.get<string>('SMTP_PASS');
        const smtpSecureRaw = config.get<string>('SMTP_SECURE');

        // Gmail: port 587 => STARTTLS (secure=false), port 465 => SMTPS (secure=true)
        const secure =
          smtpSecureRaw === 'true' ||
          (smtpSecureRaw !== 'false' && smtpPort === 465);

        const transport = smtpHost
          ? {
            host: smtpHost,
            port: smtpPort,
            secure,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            // Timeouts explicites pour éviter les blocages trop longs en prod (Render).
            connectionTimeout: 30_000,
            socketTimeout: 30_000,
            greetingTimeout: 30_000,
            // Sur port 587, force la négociation STARTTLS avant AUTH.
            requireTLS: !secure,
          }
          : { jsonTransport: true };

        if (!smtpHost) {
          mailLogger.warn(
            'SMTP non configuré (SMTP_HOST manquant dans .env) → aucun email réel ne sera envoyé. ' +
            'Définissez SMTP_HOST, SMTP_USER, SMTP_PASS pour envoyer de vrais emails.',
          );
        }

        const configuredMailFrom = config.get<string>('MAIL_FROM');
        const hasFromEmail = typeof configuredMailFrom === 'string' && configuredMailFrom.includes('@');
        const fromFallback = smtpUser ? `"Restaurant OS" <${smtpUser}>` : undefined;
        const defaultsFrom = hasFromEmail ? configuredMailFrom : fromFallback;

        return {
          transport,
          defaults: {
            from: defaultsFrom ?? '"Restaurant OS" <no-reply@monapp.com>',
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
