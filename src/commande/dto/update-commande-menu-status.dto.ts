// src/commande/dto/update-commande-menu-status.dto.ts
import { IsNotEmpty, IsString, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class UpdateCommandeMenuStatusDto {
    @ArrayNotEmpty()
    menuId: number;        // Pour pouvoir mettre à jour plusieurs menus à la fois

    @IsString()
    @IsNotEmpty()
    status: string;           // Nouveau statut à appliquer
}
