import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { corsConfig } from './common/config/cors.config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(corsConfig);

  // Configuration pour l'endpoint webhook Stripe : parser le body brut
  // Cette route doit recevoir le body brut pour vérifier la signature Stripe
  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

  // Pour toutes les autres routes, utiliser le parsing JSON normal
  app.use(bodyParser.json());

  //Validation globale 
  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les propriétés non définies dans le DTO
      forbidNonWhitelisted: true, // bloque les propriétés non définies
      transform: true, // transforme les payloads en instances de classes
    }),
  );

  await app.listen(3030, '0.0.0.0');

}
bootstrap();
