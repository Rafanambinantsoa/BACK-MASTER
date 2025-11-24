import { PartialType } from '@nestjs/mapped-types';
import { CreatePaiementPretDto } from './create-paiement-pret.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdatePaiementPretDto extends PartialType(CreatePaiementPretDto) {
    @IsNotEmpty()
    montantAvance: number;
}
