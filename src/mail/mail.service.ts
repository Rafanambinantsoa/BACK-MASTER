import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
import { MailerService } from '@nestjs-modules/mailer/dist/mailer.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) { }

  private async sendMailSafe<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const response = (err as { response?: string })?.response;
      const message = (err as Error)?.message ?? String(err);
      this.logger.warn(`Envoi email échoué: ${code ?? 'unknown'} - ${response ?? message}`);

      if (code === 'EAUTH' || (typeof response === 'string' && response.includes('535'))) {
        throw new BadRequestException(
          'Échec SMTP : identifiants invalides. Vérifiez SMTP_USER / SMTP_PASS dans .env. ' +
          'Avec Gmail, utilisez un "Mot de passe d\'application" (compte Google → Sécurité).',
        );
      }
      if (code === 'ETIMEDOUT') {
        throw new BadRequestException(
          'Échec SMTP : délai de connexion dépassé (timeout). Vérifie que Render peut joindre SMTP_HOST/SMTP_PORT (pare-feu / restrictions réseau).',
        );
      }
      if (code === 'ESOCKET' || code === 'ECONNREFUSED') {
        throw new BadRequestException(
          'Échec SMTP : impossible de joindre le serveur. Vérifiez SMTP_HOST / SMTP_PORT.',
        );
      }
      throw new BadRequestException(
        `Échec d'envoi d'email : ${message}`,
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

  /**
   * Envoie la facture / récapitulatif d'une commande au client par email.
   * @param to Email du client
   * @param clientName Nom du client
   * @param reference Ex. COM-000001
   * @param dateCommande Date formatée (ex. 22/01/2026)
   * @param items Lignes { nom, quantity, prixUnitaireStr, sousTotalStr }
   * @param totalStr Total formaté (ex. "45,00 €")
   */
  async sendFactureCommande(
    to: string,
    clientName: string,
    reference: string,
    dateCommande: string,
    items: { nom: string; quantity: number; prixUnitaireStr: string; sousTotalStr: string }[],
    totalStr: string,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (!smtpHost) {
      throw new BadRequestException(
        'SMTP non configuré. Définissez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env pour envoyer des factures.',
      );
    }

    return this.sendMailSafe(() =>
      this.mailerService.sendMail({
        to,
        subject: `Facture ${reference} – Restaurant OS`,
        template: './facture-commande',
        context: {
          clientName,
          reference,
          dateCommande,
          items,
          totalStr,
        },
      }),
    );
  }

  /**
   * Envoi asynchrone (fire-and-forget) : détail de la réservation au client.
   * N'interrompt jamais le flux appelant ; les erreurs sont loguées.
   */
  async sendDetailReservation(to: string, context: Record<string, unknown>): Promise<void> {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (!smtpHost) {
      this.logger.warn(
        `Email "détail réservation" non envoyé à ${to} : SMTP non configuré. ` +
        'Ajoutez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env.',
      );
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Détail de votre réservation – Restaurant OS',
        template: './detail-reservation',
        context,
      });
      this.logger.log(`Email "détail réservation" envoyé à ${to}`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg = (err as Error)?.message;
      this.logger.warn(
        `Envoi email "détail réservation" échoué pour ${to}: ${code ?? 'unknown'} - ${msg ?? err}`,
      );
    }
  }

  /**
   * Envoi asynchrone (fire-and-forget) : compte créé + identifiants + lien login.
   * N'interrompt jamais le flux appelant ; les erreurs sont loguées.
   */
  async sendAccountCreated(
    email: string,
    name: string,
    tempPassword: string,
    loginUrl: string,
  ): Promise<void> {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (!smtpHost) {
      this.logger.warn(
        `Email "compte créé" non envoyé à ${email} : SMTP non configuré. ` +
        'Ajoutez SMTP_HOST, SMTP_USER, SMTP_PASS (et optionnellement SMTP_PORT, SMTP_SECURE) dans .env.',
      );
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Ton compte Restaurant OS a été créé',
        template: './compte-cree',
        context: {
          name,
          email,
          tempPassword,
          loginUrl,
        },
      });
      this.logger.log(`Email "compte créé" envoyé à ${email}`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg = (err as Error)?.message;
      this.logger.warn(
        `Envoi email "compte créé" échoué pour ${email}: ${code ?? 'unknown'} - ${msg ?? err}`,
      );
    }
  }
}
