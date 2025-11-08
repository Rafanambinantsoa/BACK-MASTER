import { PartialType } from '@nestjs/mapped-types';
import { CreateCommandeMenuDto } from './create-commande-menu.dto';

export class UpdateCommandeMenuDto extends PartialType(CreateCommandeMenuDto) {}
