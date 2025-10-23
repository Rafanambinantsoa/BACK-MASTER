import { Menu } from "src/menu/entities/menu.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TypeMenu {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    nom: string;

    @OneToMany(() => Menu, (menu) => menu.type_menu)
    menus: Menu[];
}
