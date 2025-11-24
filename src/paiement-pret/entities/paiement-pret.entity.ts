// paiement-pret.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PaiementReste } from "./paiement-reste.entity";

@Entity()
export class PaiementPret {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    commandeId: number;

    @Column("decimal", { precision: 10, scale: 2 })
    montantTotal: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    montantAvance: number;

    @Column({ default: false })
    estRegle: boolean;

    @Column()
    typePaiement: string; // ex: "initial"

    @OneToMany(() => PaiementReste, (paiementReste) => paiementReste.paiementPret)
    paiementsReste: PaiementReste[];
}
