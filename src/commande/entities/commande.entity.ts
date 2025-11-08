import { CommandeMenu } from "src/commande-menu/entities/commande-menu.entity";
import { Reservation } from "src/reservation/entities/reservation.entity";
import { AfterInsert, Column, Entity, getRepository, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Commande {
    @PrimaryGeneratedColumn()
    id: number;

    //Une colonne qui se ferait automatique genere COM-{id}
    @Column()
    reference: string;

    @Column({ nullable: true })
    reservation_id: number;

    @ManyToOne(() => Reservation, (reservation) => reservation.commandes, { eager: true })
    @JoinColumn({ name: 'reservation_id' }) // précise la colonne FK
    reservation: Reservation;

    @ManyToOne(() => CommandeMenu, (commandeMenu) => commandeMenu.commande, { eager: true })
    @JoinColumn({ name: 'commande_id' }) // précise la colonne FK
    commandeMenu: CommandeMenu;

    @Column()
    date_commande: Date;

    @Column({ default: "en_cours" })
    status: string;

    @AfterInsert()
    async setReference() {
        if (!this.reference) {
            const repo = getRepository(Commande);
            this.reference = `COM-${this.id}`;
            await repo.update(this.id, { reference: this.reference });
        }
    }
}
