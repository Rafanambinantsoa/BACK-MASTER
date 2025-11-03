import { Module } from '@nestjs/common';
import { PaimentReservationTableService } from './paiment-reservation-table.service';
import { PaimentReservationTableController } from './paiment-reservation-table.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaimentReservationTable } from './entities/paiment-reservation-table.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaimentReservationTable, Reservation])],
  controllers: [PaimentReservationTableController],
  providers: [PaimentReservationTableService],
})
export class PaimentReservationTableModule { }
