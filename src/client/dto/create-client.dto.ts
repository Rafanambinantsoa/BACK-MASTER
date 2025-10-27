import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class CreateClientDto {
    @IsNotEmpty()
    nom: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsOptional()
    telephone: string;

    @IsOptional()
    adresse: string;
}
