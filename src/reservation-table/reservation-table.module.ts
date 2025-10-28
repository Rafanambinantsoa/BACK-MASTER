import { Module } from '@nestjs/common';
import { ReservationTableService } from './reservation-table.service';
import { ReservationTableController } from './reservation-table.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationTable } from './entities/reservation-table.entity';
import { Client } from 'src/client/entities/client.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationTable, Client, Reservation])],
  controllers: [ReservationTableController],
  providers: [ReservationTableService],
})
export class ReservationTableModule { }
