import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Table {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    numero_table: string;
}
