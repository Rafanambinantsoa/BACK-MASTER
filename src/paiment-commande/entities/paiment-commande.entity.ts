import { Commande } from "src/commande/entities/commande.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PaimentCommande {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    slugcommandId: string;


    @Column({ nullable: true })
    commande_id: number;

    @Column()
    type_paiment: string;

    @Column({ nullable: true })
    reference: string;

    @Column({ nullable: true })
    stripe_payment_intent_id: string;

    @Column()
    montant: number;

    @ManyToOne(() => Commande, (commande) => commande.paimentCommandes, { eager: true })
    @JoinColumn({ name: 'commande_id' }) // précise la colonne FK
    commande: Commande;
}
