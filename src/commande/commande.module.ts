import { Module } from '@nestjs/common';
import { CommandeService } from './commande.service';
import { CommandeController } from './commande.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commande } from './entities/commande.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { CommandeMenu } from 'src/commande-menu/entities/commande-menu.entity';
import { Client } from 'src/client/entities/client.entity';
import { Table } from 'src/table/entities/table.entity';
import { ReservationTable } from 'src/reservation-table/entities/reservation-table.entity';
import { PaiementPret } from 'src/paiement-pret/entities/paiement-pret.entity';
import { PusherModule } from 'src/pusher/pusher.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commande, Reservation, Menu, CommandeMenu, Client, Table, ReservationTable, PaiementPret]),
    PusherModule,
    MailModule,
  ],
  controllers: [CommandeController],
  providers: [CommandeService],
})
export class CommandeModule { }
