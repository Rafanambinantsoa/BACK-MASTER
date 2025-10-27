import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
