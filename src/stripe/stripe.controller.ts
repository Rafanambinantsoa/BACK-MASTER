import { Controller, Post, Req, Res, Headers, Inject, forwardRef, Body, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ReservationService } from '../reservation/reservation.service';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaimentCommandeService } from 'src/paiment-commande/paiment-commande.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => ReservationService))
    private readonly reservationService: ReservationService,
    private readonly paimentCommandeService: PaimentCommandeService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Endpoint webhook pour recevoir les événements Stripe
   * Route: POST /stripe/webhook
   * 
   * IMPORTANT: Ce endpoint doit recevoir le body brut (raw) pour vérifier la signature
   * Configurez votre serveur/proxy pour ne pas parser le body pour cette route
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      if (!signature) {
        return res.status(400).json({ error: 'Signature Stripe manquante' });
      }

      // Le body doit être brut (Buffer) pour vérifier la signature
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
      
      // Vérifier la signature du webhook
      const event = this.stripeService.verifyWebhookSignature(
        rawBody,
        signature,
      );

      // Traiter l'événement selon son type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as any);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as any);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object as any);
          break;

        default:
          console.log(`Événement non géré: ${event.type}`);
      }

      // Répondre à Stripe pour confirmer la réception
      res.json({ received: true });
    } catch (error) {
      console.error('Erreur webhook Stripe:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Crée un PaymentIntent pour l'encaissement d'une commande
   * Utilisé par le frontend de caisse lors du choix du mode Stripe
   */
  @Post('commande-payment-intent')
  async createCommandePaymentIntent(
    @Body()
    body: {
      commandeId: number;
      amount: number;
    },
  ) {
    const { commandeId, amount } = body;

    if (!commandeId || !amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('commandeId et amount valides sont requis');
    }

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent(
      amountInCents,
      {
        commandeId,
      },
    );

    if (!paymentIntent.client_secret) {
      throw new BadRequestException('Stripe client_secret manquant');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Crée un PaymentIntent pour le paiement du reste d'un prêt
   * Utilisé par le frontend lors du choix du mode Stripe pour un PaiementPret
   */
  @Post('pret-reste-payment-intent')
  async createPretRestePaymentIntent(
    @Body()
    body: {
      pretId: number;
      amount: number;
    },
  ) {
    const { pretId, amount } = body;

    if (!pretId || !amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('pretId et amount valides sont requis');
    }

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent(
      amountInCents,
      {
        pretId,
      },
    );

    if (!paymentIntent.client_secret) {
      throw new BadRequestException('Stripe client_secret manquant');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Gère l'événement payment_intent.succeeded
   */
  private async handlePaymentIntentSucceeded(paymentIntent: any) {
    const paymentIntentId = paymentIntent.id;
    
    // Trouver la réservation associée à ce PaymentIntent
    await this.reservationService.confirmStripePayment(paymentIntentId);
    
    console.log(`Paiement confirmé pour PaymentIntent: ${paymentIntentId}`);
  }

  /**
   * Gère l'événement payment_intent.payment_failed
   */
  private async handlePaymentIntentFailed(paymentIntent: any) {
    const paymentIntentId = paymentIntent.id;
    console.log(`Paiement échoué pour PaymentIntent: ${paymentIntentId}`);
    // Vous pouvez ajouter une logique pour gérer les échecs si nécessaire
  }

  /**
   * Gère l'événement payment_intent.canceled
   */
  private async handlePaymentIntentCanceled(paymentIntent: any) {
    const paymentIntentId = paymentIntent.id;
    console.log(`Paiement annulé pour PaymentIntent: ${paymentIntentId}`);
    // Vous pouvez ajouter une logique pour gérer les annulations si nécessaire
  }
}
