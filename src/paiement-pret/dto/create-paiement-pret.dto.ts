// create-paiement-pret.dto.ts
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreatePaiementPretDto {
    @IsNotEmpty()
    commandeId: number;

    @IsNotEmpty()
    montantTotal: number;

    @IsOptional()
    montantAvance: number;

    @IsOptional()
    modePaiement: string;

    @IsOptional()
    reference: string;
}
