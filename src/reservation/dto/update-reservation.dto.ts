import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationDto } from './create-reservation.dto';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
    date: Date;

    heure_debut: string;

    heure_fin: string;

    type_reservation: string;

    montant: number;

    reference: string;

    type_paiment: string;
}
