import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { join } from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';

type TemplateContext = Record<string, unknown>;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend?: Resend;
  private readonly templatesDir: string;
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }

    // Après build, les templates sont copiés dans dist/mail/templates via nest-cli.json assets.
    this.templatesDir = join(__dirname, 'templates');
  }

  private getFrom(): string {
    const from =
      this.configService.get<string>('RESEND_FROM') ||
      this.configService.get<string>('MAIL_FROM');
    if (from && from.includes('@')) return from;

    const fallback = this.configService.get<string>('SMTP_USER');
    if (fallback && fallback.includes('@')) {
      return `"Restaurant OS" <${fallback}>`;
    }

    return `"Restaurant OS" <no-reply@monapp.com>`;
  }

  private renderTemplate(templateName: string, context: TemplateContext): string {
    const cached = this.templateCache.get(templateName);
    if (cached) return cached(context);

    const filePath = join(this.templatesDir, `${templateName}.hbs`);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Template email introuvable: ${templateName}`);
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    const compiled = Handlebars.compile(source, { strict: true });
    this.templateCache.set(templateName, compiled);
    return compiled(context);
  }

  private async sendHtmlEmail(params: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.resend) {
      throw new BadRequestException(
        'RESEND_API_KEY manquant. Ajoutez la clé Resend dans les variables d\'environnement.',
      );
    }

    try {
      const result: any = await this.resend.emails.send({
        from: this.getFrom(),
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (result?.error) {
        const message = result.error?.message ?? 'Erreur Resend inconnue';
        throw new Error(message);
      }
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? String(err);
      this.logger.warn(`Envoi email Resend échoué: ${message}`);
      throw new BadRequestException(`Échec d'envoi d'email : ${message}`);
    }
  }

  async sendUserConfirmation(email: string, username: string, token: string) {
    const url = `https://monapp.com/confirmation?token=${token}`;
    const html = this.renderTemplate('confirmation', { name: username, url });
    await this.sendHtmlEmail({
      to: email,
      subject: 'Confirme ton compte',
      html,
    });
  }

  async sendCustomEmail(to: string, subject: string, html: string) {
    await this.sendHtmlEmail({ to, subject, html });
  }

  /**
   * Envoie la facture / récapitulatif d'une commande au client par email.
   */
  async sendFactureCommande(
    to: string,
    clientName: string,
    reference: string,
    dateCommande: string,
    items: { nom: string; quantity: number; prixUnitaireStr: string; sousTotalStr: string }[],
    totalStr: string,
  ) {
    const html = this.renderTemplate('facture-commande', {
      clientName,
      reference,
      dateCommande,
      items,
      totalStr,
    });

    await this.sendHtmlEmail({
      to,
      subject: `Facture ${reference} – Restaurant OS`,
      html,
    });
  }

  /**
   * Envoi asynchrone (fire-and-forget) : détail de la réservation au client.
   * N'interrompt jamais le flux appelant ; les erreurs sont loguées.
   */
  async sendDetailReservation(to: string, context: Record<string, unknown>): Promise<void> {
    try {
      const html = this.renderTemplate('detail-reservation', context);
      await this.sendHtmlEmail({
        to,
        subject: 'Détail de votre réservation – Restaurant OS',
        html,
      });
      this.logger.log(`Email "détail réservation" envoyé à ${to}`);
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? String(err);
      this.logger.warn(`Envoi email "détail réservation" échoué pour ${to}: ${message}`);
    }
  }

  /**
   * Envoi asynchrone (fire-and-forget) : compte créé + identifiants + lien login.
   */
  async sendAccountCreated(
    email: string,
    name: string,
    tempPassword: string,
    loginUrl: string,
  ): Promise<void> {
    try {
      const html = this.renderTemplate('compte-cree', {
        name,
        email,
        tempPassword,
        loginUrl,
      });

      await this.sendHtmlEmail({
        to: email,
        subject: 'Ton compte Restaurant OS a été créé',
        html,
      });

      this.logger.log(`Email "compte créé" envoyé à ${email}`);
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? String(err);
      this.logger.warn(`Envoi email "compte créé" échoué pour ${email}: ${message}`);
    }
  }
}
