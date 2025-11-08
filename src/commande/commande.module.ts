import { Module, Res } from '@nestjs/common';
import { CommandeService } from './commande.service';
import { CommandeController } from './commande.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commande } from './entities/commande.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { CommandeMenu } from 'src/commande-menu/entities/commande-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commande, Reservation, Menu, CommandeMenu])],
  controllers: [CommandeController],
  providers: [CommandeService],
})
export class CommandeModule { }
