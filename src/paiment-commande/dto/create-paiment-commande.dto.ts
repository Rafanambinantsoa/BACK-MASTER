import { IsNotEmpty, IsOptional } from "class-validator";

export class CreatePaimentCommandeDto {
    @IsNotEmpty()
    commande_id: number;

    @IsNotEmpty()
    type_paiment: string;

    @IsOptional()
    reference: string;

    @IsOptional()
    stripe_payment_intent_id: string;

    @IsNotEmpty()
    montant: number;
}
