import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationTableDto } from './create-reservation-table.dto';

export class UpdateReservationTableDto extends PartialType(CreateReservationTableDto) {}
