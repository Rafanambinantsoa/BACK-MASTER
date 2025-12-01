// paiement-pret.entity.ts
import { Commande } from "src/commande/entities/commande.entity";
import { PaiementReste } from "src/paiment-reste/entities/paiment-reste.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @Column("decimal", { precision: 10, scale: 2 })
    reste_a_regler: number;

    @OneToMany(() => PaiementReste, (paiementReste) => paiementReste.paiementPret, { nullable: false })
    paiementsReste: PaiementReste[];

    @ManyToOne(() => Commande, (commande) => commande.paiementPrets, { eager: true })
    @JoinColumn({ name: 'commandeId' }) // précise la colonne FK
    commande: Commande;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
