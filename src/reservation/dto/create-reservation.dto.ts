import { IsArray, IsNotEmpty } from "class-validator";

export class CreateReservationDto {
    @IsNotEmpty()
    client_id: number;

    @IsNotEmpty()
    date: Date;

    @IsNotEmpty()
    heure_debut: string;

    @IsNotEmpty()
    heure_fin: string;

    @IsNotEmpty()
    status: string;

    @IsArray()
    tableIds: number[];

}
