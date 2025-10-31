import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationMenuDto } from './create-reservation-menu.dto';

export class UpdateReservationMenuDto extends PartialType(CreateReservationMenuDto) {}
