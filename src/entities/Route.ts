import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tbl_City } from "../entities/City";

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    route_id: number;

    @Column({ type: 'enum', enum: ['Austria to Ukraine', 'Ukraine to Austria'] })
    route_direction: string;

    @ManyToOne(() => Tbl_City, { nullable: false })
    pickup_point: Tbl_City;

    @ManyToOne(() => Tbl_City, { nullable: false })
    dropoff_point: Tbl_City;

    @Column({ type: 'float', nullable: true })
    distance_km: number;

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
}
