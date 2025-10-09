import { IsBoolean, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: 'Le nom est obligatoire' })
    nom: string;

    @IsNotEmpty({ message: 'L\'email est obligatoire' })
    email: string;

    @IsNotEmpty({ message: 'Le statut est obligatoire' })
    @IsBoolean({ message: 'Le statut doit être un booléen' })
    statut: boolean;

    @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password: string;


}
