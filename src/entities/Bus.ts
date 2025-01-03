import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Route } from './Route';
import { Driver } from './Driver';

@Entity()
export class Bus {
    @PrimaryGeneratedColumn()
    bus_id: number;

    @Column({ unique: true })
    bus_name: string;

    @Column({ unique: true })
    bus_number: string;

    @Column({ nullable: true })
    registration_number: string;

    @Column({ nullable: true })
    insurance_expiry_date: Date;

    @Column({ type: 'integer' })
    total_seats: number;

    @Column({ type: 'enum', enum: ['Sleeper', 'Seater', 'AC', 'Non-AC'], default: 'Seater' })
    bus_type: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Route, { nullable: true })
    route: Route;

    @ManyToOne(() => Driver, { nullable: true })
    driver: Driver;
}
