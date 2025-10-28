import { Client } from "src/client/entities/client.entity";
import { ReservationTable } from "src/reservation-table/entities/reservation-table.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @ManyToOne(() => Client, (client) => client.reservations)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @OneToMany(() => ReservationTable, (reservationTable) => reservationTable.reservation, { eager: true })
    reservationTables: ReservationTable[];
}
