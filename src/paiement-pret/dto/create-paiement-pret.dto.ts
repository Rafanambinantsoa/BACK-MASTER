import { IsNotEmpty, IsOptional } from "class-validator";

export class CreatePaiementPretDto {
    @IsNotEmpty()
    commandeId: number;

    @IsNotEmpty()
    montantTotal: number

    @IsOptional()
    montantAvance: number;

    @IsOptional()
    reference: string;

    @IsNotEmpty()
    typePaiement: string;
}
