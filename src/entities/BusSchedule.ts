import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Bus } from './Bus';
import { Stop } from './Stop';

@Entity()
export class BusSchedule {
    @PrimaryGeneratedColumn()
    schedule_id: number;

    @ManyToOne(() => Bus, { nullable: false })
    bus: Bus;

    @ManyToOne(() => Stop, { nullable: false })
    stop: Stop;

    @Column({ type: 'time' })
    arrival_time: string;

    @Column({ type: 'time' })
    departure_time: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
