import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

// DTO interne (tu peux aussi le mettre dans un fichier séparé)
export class LoginDto {
    @IsEmail()
    email: string;

    @IsNotEmpty({ message: 'Le mot de passe ne peut pas être vide' })
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password: string;
}