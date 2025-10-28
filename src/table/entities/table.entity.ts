import { ReservationTable } from "src/reservation-table/entities/reservation-table.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Table {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    numero_table: string;

    @OneToMany(() => ReservationTable, (reservationTable) => reservationTable.table, { eager: true })
    reservationTables: ReservationTable[];
}
