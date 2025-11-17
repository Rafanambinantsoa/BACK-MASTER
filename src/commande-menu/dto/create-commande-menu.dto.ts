import { IsNotEmpty } from "class-validator";

export class CreateCommandeMenuDto {
    @IsNotEmpty()
    menuId: number;

    @IsNotEmpty()
    quantity: number;

    @IsNotEmpty()
    status: string;

    @IsNotEmpty()
    commande_id: number;


}
