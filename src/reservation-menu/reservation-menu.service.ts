import { Injectable } from '@nestjs/common';
import { CreateReservationMenuDto } from './dto/create-reservation-menu.dto';
import { UpdateReservationMenuDto } from './dto/update-reservation-menu.dto';

@Injectable()
export class ReservationMenuService {
  create(createReservationMenuDto: CreateReservationMenuDto) {
    return 'This action adds a new reservationMenu';
  }

  findAll() {
    return `This action returns all reservationMenu`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reservationMenu`;
  }

  update(id: number, updateReservationMenuDto: UpdateReservationMenuDto) {
    return `This action updates a #${id} reservationMenu`;
  }

  remove(id: number) {
    return `This action removes a #${id} reservationMenu`;
  }
}
