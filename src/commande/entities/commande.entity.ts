import { CommandeMenu } from "src/commande-menu/entities/commande-menu.entity";
import { PaiementPret } from "src/paiement-pret/entities/paiement-pret.entity";
import { PaimentCommande } from "src/paiment-commande/entities/paiment-commande.entity";
import { Reservation } from "src/reservation/entities/reservation.entity";
import { AfterInsert, Column, Entity, getRepository, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Commande {
    @PrimaryGeneratedColumn()
    id: number;

    //Une colonne qui se ferait automatique genere COM-{id}
    @Column({ nullable: true })
    reference: string;


    @Column({ nullable: true })
    reservation_id: number;

    @ManyToOne(() => Reservation, (reservation) => reservation.commandes, { eager: true })
    @JoinColumn({ name: 'reservation_id' }) // précise la colonne FK
    reservation: Reservation;

    @OneToMany(() => CommandeMenu, (commandeMenu) => commandeMenu.commande, { eager: true })
    commandeMenu: CommandeMenu[];

    @Column()
    date_commande: Date;

    @Column({ default: "en_cours" })
    status: string;

    @Column({ default: 0 })
    total_price: number;

    @OneToMany(() => PaimentCommande, (paimentCommande) => paimentCommande.commande)
    paimentCommandes: PaimentCommande[];

    //Par rapport au pret 
    @OneToMany(() => PaiementPret, (paiementPret) => paiementPret.commande)
    paiementPrets: PaiementPret[];

}
