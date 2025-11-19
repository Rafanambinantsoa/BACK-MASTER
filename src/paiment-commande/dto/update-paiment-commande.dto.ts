import { PartialType } from '@nestjs/mapped-types';
import { CreatePaimentCommandeDto } from './create-paiment-commande.dto';

export class UpdatePaimentCommandeDto extends PartialType(CreatePaimentCommandeDto) {}
