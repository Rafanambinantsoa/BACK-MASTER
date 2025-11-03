import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaimentReservationTableService } from './paiment-reservation-table.service';
import { CreatePaimentReservationTableDto } from './dto/create-paiment-reservation-table.dto';
import { UpdatePaimentReservationTableDto } from './dto/update-paiment-reservation-table.dto';

@Controller('paiment-reservation-table')
export class PaimentReservationTableController {
  constructor(private readonly paimentReservationTableService: PaimentReservationTableService) {}

  @Post()
  create(@Body() createPaimentReservationTableDto: CreatePaimentReservationTableDto) {
    return this.paimentReservationTableService.create(createPaimentReservationTableDto);
  }

  @Get()
  findAll() {
    return this.paimentReservationTableService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paimentReservationTableService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaimentReservationTableDto: UpdatePaimentReservationTableDto) {
    return this.paimentReservationTableService.update(+id, updatePaimentReservationTableDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paimentReservationTableService.remove(+id);
  }
}
