import { IsNotEmpty } from "class-validator";

export class CreateTableDto {
    @IsNotEmpty()
    numero_table: string
}
