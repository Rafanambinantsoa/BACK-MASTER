import { IsNotEmpty, Matches } from "class-validator";

export class DispoDto {
    @IsNotEmpty()
    date: Date;

    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):(00|30)$/, {
        message: "L'heure de début doit être au format HH:MM (aligné sur 30 min)",
    })
    heureDebut: string;

    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):(00|30)$/, {
        message: "L'heure de fin doit être au format HH:MM (aligné sur 30 min)",
    })
    heureFin: string;
}