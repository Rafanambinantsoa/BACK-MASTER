import { Commande } from "src/commande/entities/commande.entity";
import { Menu } from "src/menu/entities/menu.entity";
import { Role } from "src/role/entities/role.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CommandeMenu {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    commande_id: number;

    @Column({ nullable: true })
    menuId: number

    @Column({ default: 'en_atttente' })
    status: string;

    @ManyToOne(() => Commande, (commande) => commande.commandeMenu)
    @JoinColumn({ name: 'commande_id' }) // précise la colonne FK
    commande: Commande;

    @ManyToOne(() => Menu, (menu) => menu.commandeMenus)
    @JoinColumn({ name: 'menuId' }) // précise la colonne FK
    menu: Menu;

    @Column({ type: 'int', default: 1 })
    quantity: number;
}
