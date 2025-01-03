import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Bus } from './Bus';
import { Route } from './Route';

@Entity()
export class BusSchedule {
    @PrimaryGeneratedColumn()
    schedule_id: number;

    @ManyToOne(() => Bus, { nullable: false })
    bus_id: Bus;

    @ManyToOne(() => Route, { nullable: false })
    route_id: Route;

    @Column({ type: 'date' })
    start_date: Date;

    @Column({ type: 'date' })
    end_date: Date;

    @Column({ type: 'int', nullable: false, default: 0 })
    available_seats: number;

    @Column({ type: 'time' })
    departure_time: string;

    @Column({ type: 'time' })
    arrival_time: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}