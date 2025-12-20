import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {

    private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-12-15.clover'
    });

    createPaymentIntent(amount: number, metadata: Record<string, any>) {
        return this.stripe.paymentIntents.create({
            amount,
            currency: 'mga',
            payment_method_types: ['card'],
            metadata,
        });
    }

    /**
     * Vérifie la signature du webhook Stripe pour sécuriser l'endpoint
     */
    verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            throw new BadRequestException('STRIPE_WEBHOOK_SECRET non configuré');
        }

        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret
            );
            return event;
        } catch (err) {
            throw new BadRequestException(`Signature webhook invalide: ${err.message}`);
        }
    }

    /**
     * Récupère un PaymentIntent par son ID
     */
    async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    }
}
