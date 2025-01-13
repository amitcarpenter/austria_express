import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Route } from "../entities/Route";
import { City } from "../entities/City";

@Entity()
export class Route_Stops {
    @PrimaryGeneratedColumn()
    stop_id: number;

    @ManyToOne(() => Route, { nullable: false, onDelete: "CASCADE" })
    route: Route;

    @ManyToOne(() => City, { nullable: false })
    stop_city: City;

    @Column({ type: 'integer', nullable: false })
    stop_order: number;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}