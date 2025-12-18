import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateCommandeDto {
    @IsNotEmpty()
    reservation_id: number;

    @IsNotEmpty()
    date_commande: Date;

    //client 
    @IsNotEmpty()
    nom: string;

    @IsNotEmpty()
    email: string;

    @IsOptional()
    telephone: string;

    @IsOptional()
    adresse: string;

    @IsNotEmpty()
    date_reservation: string;

    @IsNotEmpty()
    heure_debut: string;

    @IsNotEmpty()
    heure_fin: string;

    @IsNotEmpty()
    tablesIds: number[];

    @IsNotEmpty()
    menuIds: number[]

    @IsNotEmpty()
    quantities: number[]

    @IsNotEmpty()
    user_id: number;

}
