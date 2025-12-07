import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCommandeFromReservationDto {

    @IsNotEmpty()
    reservationId: number;

    @IsNotEmpty()
    clientId: number;

    @IsArray()
    @ArrayNotEmpty()
    menuIds: number[];

    @IsArray()
    @ArrayNotEmpty()
    quantities: number[];

    @IsOptional()
    date_commande: Date;
}
