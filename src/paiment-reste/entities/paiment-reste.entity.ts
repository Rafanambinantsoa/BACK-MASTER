// paiement-reste.entity.ts
import { PaiementPret } from "src/paiement-pret/entities/paiement-pret.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PaiementReste {
    @PrimaryGeneratedColumn()
    id: number;


    @ManyToOne(() => PaiementPret, (pret) => pret.paiementsReste, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'paiementPretId' })
    paiementPret: PaiementPret;


    @Column("decimal", { precision: 10, scale: 2 })
    montant: number;

    @Column()
    modePaiement: string; // ex: "stripe", "cash", "virement"

    @Column({ nullable: true })
    reference: string;

    @Column({ nullable: true })
    stripe: string;


    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    datePaiement: Date;
}
