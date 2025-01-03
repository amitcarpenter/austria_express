import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tbl_City } from "../entities/City";

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    route_id: number;

    @Column({ type: 'enum', enum: ['Austria to Ukraine', 'Ukraine to Austria'] })
    route_direction: string;

    @Column()
    pickup_point: string;

    @Column()
    dropoff_point: string;

    @Column({ type: 'float', nullable: true })
    distance_km: number;

    @Column({ type: 'decimal', precision: 50, scale: 2 })
    fixed_price: number;

    @Column({ type: 'integer', nullable: true })
    estimated_time: number;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ nullable: true })
    start_location_lat_long: string;

    @Column({ nullable: true })
    end_location_lat_long: string;
}
