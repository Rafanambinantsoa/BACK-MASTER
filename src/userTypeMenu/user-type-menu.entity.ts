import { TypeMenu } from "src/type_menu/entities/type_menu.entity";
import { User } from "src/user/entities/user.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserTypeMenu {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.userTypeMenus, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => TypeMenu, (typeMenu) => typeMenu.userTypeMenus, {
        onDelete: 'CASCADE', eager: true
    })
    @JoinColumn({ name: 'typeMenuId' })
    typeMenu: TypeMenu;

}