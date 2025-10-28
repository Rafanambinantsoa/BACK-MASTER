import { Menu } from "src/menu/entities/menu.entity";
import { UserTypeMenu } from "src/userTypeMenu/user-type-menu.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TypeMenu {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    nom: string;

    @OneToMany(() => Menu, (menu) => menu.type_menu)
    menus: Menu[];

    @OneToMany(() => UserTypeMenu, (userTypeMenu) => userTypeMenu.typeMenu, { eager: true })
    userTypeMenus: UserTypeMenu[];
}
