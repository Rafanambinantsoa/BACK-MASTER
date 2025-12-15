import { Injectable } from '@nestjs/common';
import { ApiVersion } from 'node_modules/stripe/types/apiVersion';
import Stripe from 'stripe';

@Injectable()
export class StripeService {

    private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-11-17.clover'
    });

    createPaymentIntent(amount: number, metadata: Record<string, any>) {
        return this.stripe.paymentIntents.create({
            amount,
            currency: 'eur',
            payment_method_types: ['card'],
            metadata,
        });
    }
}
