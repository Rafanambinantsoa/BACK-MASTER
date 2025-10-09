import { IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    nom: string;

    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    statut: string;

    @IsNotEmpty()
    password: string;


}
