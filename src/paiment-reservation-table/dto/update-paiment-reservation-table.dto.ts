import { PartialType } from '@nestjs/mapped-types';
import { CreatePaimentReservationTableDto } from './create-paiment-reservation-table.dto';

export class UpdatePaimentReservationTableDto extends PartialType(CreatePaimentReservationTableDto) {}
