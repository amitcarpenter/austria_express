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

    @Column({ type: 'integer' })
    total_seats: number;

    @ManyToOne(() => Route, { nullable: false })
    route: Route;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ nullable: true })
    registration_number: string;

    @Column({ nullable: true })
    insurance_expiry_date: Date;

    @ManyToOne(() => Driver, { nullable: false })
    driver: Driver;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
