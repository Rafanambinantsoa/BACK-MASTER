import { Module } from '@nestjs/common';
import { PaiementPretService } from './paiement-pret.service';
import { PaiementPretController } from './paiement-pret.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaiementPret } from './entities/paiement-pret.entity';
import { Commande } from 'src/commande/entities/commande.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaiementPret, Commande])],
  controllers: [PaiementPretController],
  providers: [PaiementPretService],
})
export class PaiementPretModule { }
