import { Client } from "src/client/entities/client.entity";
import { Commande } from "src/commande/entities/commande.entity";
import { PaimentReservationTable } from "src/paiment-reservation-table/entities/paiment-reservation-table.entity";
import { ReservationMenu } from "src/reservation-menu/entities/reservation-menu.entity";
import { ReservationTable } from "src/reservation-table/entities/reservation-table.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Reservation {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    client_id: number;

    @Column()
    date: Date;

    @Column()
    heure_debut: string

    @Column()
    heure_fin: string

    @Column({ default: "en_attente" })
    status: string

    @Column({ default: "standard" })
    type_reservation: string;

    @ManyToOne(() => Client, (client) => client.reservations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @OneToMany(() => ReservationTable, (reservationTable) => reservationTable.reservation, { eager: true })
    reservationTables: ReservationTable[];

    @OneToMany(() => ReservationMenu, (reservationMenu) => reservationMenu.reservation, { eager: true })
    reservationMenus: ReservationMenu[];

    @OneToOne(() => PaimentReservationTable, (paimentReservationTable) => paimentReservationTable.reservation)
    paimentReservationTable: PaimentReservationTable;

    @OneToMany(() => Commande, (commande) => commande.reservation)
    commandes: Commande[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
