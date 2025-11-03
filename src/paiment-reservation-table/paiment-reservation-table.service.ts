import { Injectable } from '@nestjs/common';
import { CreatePaimentReservationTableDto } from './dto/create-paiment-reservation-table.dto';
import { UpdatePaimentReservationTableDto } from './dto/update-paiment-reservation-table.dto';

@Injectable()
export class PaimentReservationTableService {
  create(createPaimentReservationTableDto: CreatePaimentReservationTableDto) {
    return 'This action adds a new paimentReservationTable';
  }

  findAll() {
    return `This action returns all paimentReservationTable`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paimentReservationTable`;
  }

  update(id: number, updatePaimentReservationTableDto: UpdatePaimentReservationTableDto) {
    return `This action updates a #${id} paimentReservationTable`;
  }

  remove(id: number) {
    return `This action removes a #${id} paimentReservationTable`;
  }
}
