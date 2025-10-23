import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateMenuDto {

    @IsNotEmpty({ message: "C'est  oubligatoire le nom " })
    nom: string;

    @IsOptional()
    description: string;

    @IsNotEmpty({ message: "C'est  obligatoire" })
    statut: boolean;

    @IsOptional()
    image: string

    @IsNotEmpty({ message: "C'est  obligatoire le type menu" })
    type_menu_id: number;
}
