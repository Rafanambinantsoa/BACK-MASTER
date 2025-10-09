import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Validation globale 
  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les propriétés non définies dans le DTO
      forbidNonWhitelisted: true, // bloque les propriétés non définies
      transform: true, // transforme les payloads en instances de classes
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
