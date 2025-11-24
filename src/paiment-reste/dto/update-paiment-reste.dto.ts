import { PartialType } from '@nestjs/mapped-types';
import { CreatePaimentResteDto } from './create-paiment-reste.dto';

export class UpdatePaimentResteDto extends PartialType(CreatePaimentResteDto) {}
