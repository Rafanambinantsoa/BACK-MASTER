import { PartialType } from '@nestjs/mapped-types';
import { CreatePaiementResteDto } from './create-paiment-reste.dto';

export class UpdatePaimentResteDto extends PartialType(CreatePaiementResteDto) { }
