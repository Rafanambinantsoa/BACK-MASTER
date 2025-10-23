import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeMenuDto } from './create-type_menu.dto';

export class UpdateTypeMenuDto extends PartialType(CreateTypeMenuDto) {}
