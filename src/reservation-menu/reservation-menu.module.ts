import { Module } from '@nestjs/common';
import { ReservationMenuService } from './reservation-menu.service';
import { ReservationMenuController } from './reservation-menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationMenu } from './entities/reservation-menu.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { Menu } from 'src/menu/entities/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationMenu, Reservation, Menu])],
  controllers: [ReservationMenuController],
  providers: [ReservationMenuService],
})
export class ReservationMenuModule { }
