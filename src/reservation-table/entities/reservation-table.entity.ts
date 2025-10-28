import { Reservation } from "src/reservation/entities/reservation.entity";
import { Table } from "src/table/entities/table.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ReservationTable {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Table, (table) => table.reservationTables)
    @JoinColumn({ name: 'clientId' })
    table: Table

    @ManyToOne(() => Reservation, (reservation) => reservation.reservationTables)
    @JoinColumn({ name: 'reservationId' })
    reservation: Reservation;


}
