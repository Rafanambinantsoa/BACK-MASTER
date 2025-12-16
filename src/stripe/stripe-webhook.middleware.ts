import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import getRawBody from 'raw-body';

/**
 * Middleware pour parser le body brut pour l'endpoint webhook Stripe
 * Nécessaire pour vérifier la signature du webhook
 */
@Injectable()
export class StripeWebhookMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Vérifier si c'est la route webhook Stripe
    if (req.path === '/stripe/webhook') {
      try {
        // Parser le body brut (le body n'a pas encore été parsé par Express)
        const rawBody = await getRawBody(req, {
          length: req.headers['content-length'] ? parseInt(req.headers['content-length']) : undefined,
          limit: '10mb',
          encoding: 'utf8',
        });

        // Stocker le body brut dans req pour l'utiliser dans le contrôleur
        (req as any).rawBody = Buffer.from(rawBody, 'utf8');
        
        // Parser aussi le JSON pour pouvoir l'utiliser
        try {
          req.body = JSON.parse(rawBody);
        } catch (e) {
          // Si le parsing JSON échoue, on garde juste le rawBody
          req.body = {};
        }
      } catch (error) {
        console.error('Erreur parsing raw body:', error);
        return res.status(400).json({ error: 'Erreur lors du parsing du body' });
      }
    }
    next();
  }
}


