import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReservationMenuService } from './reservation-menu.service';
import { CreateReservationMenuDto } from './dto/create-reservation-menu.dto';
import { UpdateReservationMenuDto } from './dto/update-reservation-menu.dto';

@Controller('reservation-menu')
export class ReservationMenuController {
  constructor(private readonly reservationMenuService: ReservationMenuService) {}

  @Post()
  create(@Body() createReservationMenuDto: CreateReservationMenuDto) {
    return this.reservationMenuService.create(createReservationMenuDto);
  }

  @Get()
  findAll() {
    return this.reservationMenuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationMenuService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReservationMenuDto: UpdateReservationMenuDto) {
    return this.reservationMenuService.update(+id, updateReservationMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationMenuService.remove(+id);
  }
}
