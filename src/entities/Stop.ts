import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Route } from './Route';

@Entity()
export class Stop {
    @PrimaryGeneratedColumn()
    stop_id: number;

    @Column()
    stop_name: string;

    @Column({ type: 'integer' })
    stop_position: number;

    @Column({ nullable: true })
    stop_lat_long: string;

    @ManyToOne(() => Route, { nullable: false })
    route: Route;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price_from_previous_stop: number;

    @Column({ type: 'float', nullable: true })
    distance_from_previous_stop: number;

    @Column({ type: 'integer', nullable: true })
    time_from_previous_stop: number;    

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
