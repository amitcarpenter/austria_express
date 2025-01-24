import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Bus } from './Bus';
import { Route } from './Route';
import { Driver } from './Driver';
import { Terminal } from './Terminal'

@Entity()
export class BusSchedule {
    @PrimaryGeneratedColumn()
    schedule_id: number;

    @ManyToOne(() => Bus, { nullable: false })
    bus: Bus;

    @ManyToOne(() => Route, { nullable: false })
    route: Route;

    @ManyToOne(() => Driver, { nullable: false })
    driver: Driver;

    @Column({ type: 'time', nullable: false })
    departure_time: string;

    @Column({ type: 'time', nullable: false })
    arrival_time: string;

    @Column({ type: 'time', nullable: true })
    duration_time: string;

    @Column({ nullable: true })
    no_of_days: string;

    @Column({ type: 'enum', enum: ['Daily', 'Weekly', 'Custom'], default: 'Daily' })
    recurrence_pattern: string;

    @Column({ nullable: true })
    days_of_week: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}