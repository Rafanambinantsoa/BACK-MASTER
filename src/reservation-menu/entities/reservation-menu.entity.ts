import { Menu } from "src/menu/entities/menu.entity";
import { Reservation } from "src/reservation/entities/reservation.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ReservationMenu {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Reservation, (reservation) => reservation.reservationMenus, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reservationId' })
    reservation: Reservation;

    @ManyToOne(() => Menu, (menu) => menu.reservationMenus, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'menuId' })
    menu: Menu;
}
