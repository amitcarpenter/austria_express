import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { City } from "../entities/City";

@Entity()
export class Terminal {
    @PrimaryGeneratedColumn()
    terminal_id: number;

    @ManyToOne(() => City, { nullable: false, onDelete: 'CASCADE' })
    city: City;

    @Column()
    terminal_name: string;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}