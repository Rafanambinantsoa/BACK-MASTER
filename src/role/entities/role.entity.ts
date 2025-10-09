import { Column, Entity, IsNull, PrimaryGeneratedColumn, } from "typeorm";

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
}
