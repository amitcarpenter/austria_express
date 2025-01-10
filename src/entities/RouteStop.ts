import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Route } from "../entities/Route";
import { Tbl_City } from "../entities/City";

@Entity()
export class Route_Stops {
    @PrimaryGeneratedColumn()
    stop_id: number;

    @ManyToOne(() => Route, { nullable: false, onDelete: "CASCADE" })
    route_id: Route;

    @ManyToOne(() => Tbl_City, { nullable: false })
    stop_city_id: Tbl_City;

    @Column({ type: 'integer', nullable: false })
    stop_order: number;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}