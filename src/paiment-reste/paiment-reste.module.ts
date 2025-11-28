import { Module } from '@nestjs/common';
import { PaimentResteService } from './paiment-reste.service';
import { PaimentResteController } from './paiment-reste.controller';
import { PaiementReste } from './entities/paiment-reste.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaiementPret } from 'src/paiement-pret/entities/paiement-pret.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaiementReste, PaiementPret])],
  controllers: [PaimentResteController],
  providers: [PaimentResteService],
})
export class PaimentResteModule { }
