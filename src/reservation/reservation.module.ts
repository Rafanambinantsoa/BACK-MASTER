import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { Client } from 'src/client/entities/client.entity';
import { ReservationTable } from 'src/reservation-table/entities/reservation-table.entity';
import { Table } from 'src/table/entities/table.entity';
import { ReservationMenu } from 'src/reservation-menu/entities/reservation-menu.entity';
import { Menu } from 'src/menu/entities/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Client, ReservationTable, Table, ReservationMenu, Menu])],
  controllers: [ReservationController],
  providers: [ReservationService],
})
export class ReservationModule { }
