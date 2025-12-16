import { Module, forwardRef } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ReservationModule } from '../reservation/reservation.module';
import { PaimentCommandeModule } from 'src/paiment-commande/paiment-commande.module';

@Module({
  imports: [forwardRef(() => ReservationModule), PaimentCommandeModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule { }
