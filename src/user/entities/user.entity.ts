import { UserTypeMenu } from "src/userTypeMenu/user-type-menu.entity";
import { Role } from "src/role/entities/role.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nom: string;

    @Column()
    email: string;

    @Column()
    statut: boolean;

    @Column()
    password: string;

    @Column({ nullable: true })
    role_id: number;

    @ManyToOne(() => Role, (role) => role.users, { eager: true })
    @JoinColumn({ name: 'role_id' }) // précise la colonne FK
    role: Role;

    @OneToMany(() => UserTypeMenu, (userTypeMenu) => userTypeMenu.user, { eager: true })
    userTypeMenus: UserTypeMenu[];



}
