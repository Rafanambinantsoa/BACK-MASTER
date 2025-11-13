import { CommandeMenu } from "src/commande-menu/entities/commande-menu.entity";
import { ReservationMenu } from "src/reservation-menu/entities/reservation-menu.entity";
import { TypeMenu } from "src/type_menu/entities/type_menu.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Menu {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nom: string;

    @Column()
    description: string;

    @Column()
    statut: boolean;

    @Column({ nullable: true })
    image: string

    @Column('decimal', { precision: 10, scale: 2 })
    prix: number;

    @Column({ nullable: true })
    type_menu_id: number;

    @ManyToOne(() => TypeMenu, (typeMenu) => typeMenu.menus, { eager: true })
    @JoinColumn({ name: 'type_menu_id' })
    type_menu: TypeMenu;

    @OneToMany(() => ReservationMenu, (reservationMenu) => reservationMenu.menu, { eager: true })
    reservationMenus: ReservationMenu[];

    @OneToMany(() => CommandeMenu, (commandeMenu) => commandeMenu.menu, { eager: true })
    commandeMenus: CommandeMenu[];

}

