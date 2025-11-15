import { Module } from '@nestjs/common';
import { CommandeMenuService } from './commande-menu.service';
import { CommandeMenuController } from './commande-menu.controller';
import { CommandeMenu } from './entities/commande-menu.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { Commande } from 'src/commande/entities/commande.entity';
import { Client } from 'src/client/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommandeMenu, Reservation, Menu, Commande, Client])],
  controllers: [CommandeMenuController],
  providers: [CommandeMenuService],
})
export class CommandeMenuModule { }
