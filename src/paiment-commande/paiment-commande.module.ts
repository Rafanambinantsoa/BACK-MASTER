import { Module } from '@nestjs/common';
import { PaimentCommandeService } from './paiment-commande.service';
import { PaimentCommandeController } from './paiment-commande.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaimentCommande } from './entities/paiment-commande.entity';
import { Commande } from 'src/commande/entities/commande.entity';
import { Menu } from 'src/menu/entities/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaimentCommande, Commande, Menu])],
  controllers: [PaimentCommandeController],
  providers: [PaimentCommandeService],
  exports: [PaimentCommandeService],
})
export class PaimentCommandeModule { }
