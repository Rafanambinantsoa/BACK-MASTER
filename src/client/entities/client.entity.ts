import { Reservation } from "src/reservation/entities/reservation.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Client {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nom: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    telephone: string;

    @Column({ nullable: true })
    adresse: string;

    @OneToMany(() => Reservation, (reservation) => reservation.client)
    reservations: Reservation[];
}
