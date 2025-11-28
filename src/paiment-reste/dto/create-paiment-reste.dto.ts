// create-paiement-reste.dto.ts
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreatePaiementResteDto {

    @IsNotEmpty()
    montantPaye: number;

    @IsNotEmpty()
    modePaiement: string;

    @IsOptional()
    reference: string;

    @IsOptional()
    stripe: string;
}
