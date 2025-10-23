import { IsNotEmpty } from "class-validator";

export class CreateTypeMenuDto {
    @IsNotEmpty()
    nom: string;
}
