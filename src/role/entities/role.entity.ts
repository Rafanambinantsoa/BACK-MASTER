import { User } from "src/user/entities/user.entity";
import { Column, Entity, IsNull, OneToMany, PrimaryGeneratedColumn, } from "typeorm";

@Entity()
export class Role {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nom: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: "jaune" })
    couleur: string;

    @OneToMany(() => User, (user) => user.role)
    users: User[];

}
