import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) { }

  private async sendMailSafe<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const response = (err as { response?: string })?.response;
      this.logger.warn(`Envoi email échoué: ${code ?? 'unknown'} - ${response ?? (err as Error).message}`);

      if (code === 'EAUTH' || (typeof response === 'string' && response.includes('535'))) {
        throw new BadRequestException(
          'Échec SMTP : identifiants invalides. Vérifiez SMTP_USER / SMTP_PASS dans .env. ' +
          'Avec Gmail, utilisez un "Mot de passe d\'application" (compte Google → Sécurité).',
        );
      }
      if (code === 'ESOCKET' || code === 'ECONNREFUSED') {
        throw new BadRequestException(
          'Échec SMTP : impossible de joindre le serveur. Vérifiez SMTP_HOST / SMTP_PORT.',
        );
      }
      throw new BadRequestException(
        `Échec d'envoi d'email : ${(err as Error).message}`,
      );
    }
  }

  async sendUserConfirmation(email: string, username: string, token: string) {
    const url = `https://monapp.com/confirmation?token=${token}`;
    return this.sendMailSafe(() =>
      this.mailerService.sendMail({
        to: email,
        subject: 'Confirme ton compte',
        template: './confirmation',
        context: { name: username, url },
      }),
    );
  }

  async sendCustomEmail(to: string, subject: string, html: string) {
    return this.sendMailSafe(() =>
      this.mailerService.sendMail({ to, subject, html }),
    );
  }
}
