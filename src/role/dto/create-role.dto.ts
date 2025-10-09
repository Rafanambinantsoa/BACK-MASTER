import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateRoleDto {
    @IsNotEmpty({ message: "Le nom du role est obligatoire" })
    nom: string;

    @IsOptional()
    description: string;

    @IsOptional()
    couleur: string;

}
