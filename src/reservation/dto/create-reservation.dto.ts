import { IsArray, IsNotEmpty, IsOptional } from "class-validator";

export class CreateReservationDto {
    // @IsNotEmpty()
    // client_id: number;

    @IsNotEmpty()
    date: Date;

    @IsNotEmpty()
    heure_debut: string;

    @IsNotEmpty()
    heure_fin: string;

    @IsNotEmpty()
    status: string;

    @IsNotEmpty()
    type_reservation: string;

    @IsArray()
    tableIds: number[];

    @IsArray()
    @IsOptional()
    menuQuantities: number[];


    @IsOptional()
    @IsArray()
    menuIds: number[];

    @IsOptional()
    montant: number;

    @IsOptional()
    reference: string;

    @IsOptional()
    type_paiment: string;

    @IsNotEmpty()
    client_email: string;

    @IsNotEmpty()
    client_nom: string;

    @IsOptional()
    client_telephone: string;

    @IsOptional()
    client_adresse: string;

}
