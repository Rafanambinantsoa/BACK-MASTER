import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import nodemailer from 'nodemailer';

type TemplateContext = Record<string, unknown>;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templatesDir: string;
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      throw new BadRequestException(
        'SMTP manquant. Vérifiez SMTP_HOST, SMTP_USER, SMTP_PASS (et SMTP_PORT si besoin) dans les variables d\'environnement.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // SMTPS
      auth: {
        user,
        pass,
      },
      connectionTimeout: 30_000,
      socketTimeout: 30_000,
      greetingTimeout: 30_000,
    });

    // Après build, les templates sont copiés dans dist/mail/templates via nest-cli.json assets.
    this.templatesDir = join(__dirname, 'templates');
  }

  private getFrom(): string {
    const from = this.configService.get<string>('MAIL_FROM');
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
    try {
      await this.transporter.sendMail({
        from: this.getFrom(),
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? String(err);
      const code = (err as { code?: string })?.code;
      const hint =
        code === 'ETIMEDOUT'
          ? ' (timeout réseau: vérifie que le serveur peut sortir vers SMTP)'
          : '';
      this.logger.warn(`Envoi email SMTP échoué: ${code ?? 'unknown'} - ${message}${hint}`);
      throw new BadRequestException(`Échec d'envoi d'email : ${message}${hint}`);
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

  /**
   * Envoi OTP de réinitialisation mot de passe.
   */
  async sendPasswordResetOtp(
    email: string,
    name: string,
    otp: string,
    minutes: number,
  ): Promise<void> {
    try {
      const html = this.renderTemplate('password-reset-otp', {
        name,
        otp,
        minutes,
      });

      await this.sendHtmlEmail({
        to: email,
        subject: 'Code de réinitialisation – Restaurant OS',
        html,
      });

      this.logger.log(`Email "password reset otp" envoyé à ${email}`);
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? String(err);
      this.logger.warn(`Envoi email "password reset otp" échoué pour ${email}: ${message}`);
      throw err;
    }
  }
}
