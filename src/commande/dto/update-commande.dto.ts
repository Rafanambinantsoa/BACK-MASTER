import { IsOptional, IsNotEmpty, IsArray, ArrayMinSize } from "class-validator";

export class UpdateCommandeDto {
    @IsOptional()
    date_commande: Date;

    // client
    @IsOptional()
    nom?: string;

    @IsOptional()
    email?: string;

    @IsOptional()
    telephone?: string;

    @IsOptional()
    adresse?: string;

    // reservation
    @IsOptional()
    date_reservation?: string;

    @IsOptional()
    heure_debut?: string;

    @IsOptional()
    heure_fin?: string;

    @IsOptional()
    tablesIds?: number[];

    // menus - REQUIS pour la mise à jour
    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1)
    menuIds: number[];

    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1)
    quantities: number[];
}
