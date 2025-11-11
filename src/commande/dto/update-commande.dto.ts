import { PartialType } from '@nestjs/mapped-types';
import { CreateCommandeDto } from './create-commande.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommandeDto extends PartialType(CreateCommandeDto) {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    status_reservation?: string;

    date_reservation: string
}
