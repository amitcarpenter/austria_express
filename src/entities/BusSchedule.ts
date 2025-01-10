import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Bus } from './Bus';
import { Route } from './Route';
import { Driver } from './Driver';
import { Tbl_Terminal } from './Terminal'

@Entity()
export class BusSchedule {
    @PrimaryGeneratedColumn()
    schedule_id: number;

    @ManyToOne(() => Bus, { nullable: false })
    bus_id: Bus;

    @ManyToOne(() => Route, { nullable: false })
    route_id: Route;

    @ManyToOne(() => Driver, { nullable: false })
    driver_id: Driver;

    @Column({ type: 'time', nullable: false })
    departure_time: string;

    @Column({ type: 'time', nullable: false })
    arrival_time: string;

    @Column({ type: 'time', nullable: true })
    duration_time: string;

    @Column({ nullable: true })
    no_of_days: string;

    @ManyToOne(() => Tbl_Terminal, { nullable: true })
    pickup_terminal_id: Tbl_Terminal;

    @ManyToOne(() => Tbl_Terminal, { nullable: true })
    dropoff_terminal_id: Tbl_Terminal;

    @Column({ type: 'enum', enum: ['Daily', 'Weekly', 'Custom'], default: 'Daily' })
    recurrence_pattern: string;

    @Column({ nullable: true })
    days_of_week: string;

    @Column({ type: "json", nullable: false })
    base_pricing: { category: string; price: number }[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}