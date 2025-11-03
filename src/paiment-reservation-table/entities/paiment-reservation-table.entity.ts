import { Reservation } from "src/reservation/entities/reservation.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PaimentReservationTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reservation_id: number;

    @Column()
    type_paiment: string;

    @Column({ nullable: true })
    reference: string;

    @Column({ nullable: true })
    stripe_payment_intent_id: string;

    @Column()
    montant: number;

    @OneToOne(() => Reservation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reservation_id' })
    reservation: Reservation;
}
