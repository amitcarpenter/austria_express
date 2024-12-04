import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Route } from './Route';

@Entity()
export class Bus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    bus_number: string;

    @Column()
    driver_name: string;

    @Column({ type: 'integer' })
    total_seats: number;

    @ManyToOne(() => Route, { nullable: false })
    route: Route;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
