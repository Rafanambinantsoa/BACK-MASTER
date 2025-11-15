import { IsNotEmpty, IsArray, ArrayMinSize, IsNumber, Min } from "class-validator";

export class UpdateCommandeMenusDto {
    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1)
    menuIds: number[];

    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1)
    @IsNumber({}, { each: true })
    @Min(1, { each: true })
    quantities: number[];
}

