import { PartialType } from '@nestjs/mapped-types';
import { CreateCommandeMenuDto } from './create-commande-menu.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateCommandeMenuDto extends PartialType(CreateCommandeMenuDto) {
    @IsNotEmpty()
    menuId: number;

    @IsNotEmpty()
    status: string;

}
