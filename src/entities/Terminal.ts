import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tbl_City } from "../entities/City";

@Entity()
export class Tbl_Terminal {
    @PrimaryGeneratedColumn()
    terminal_id: number;

    @Column()
    city_id: number;

    @Column({ unique: true })
    terminal_name: string;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}