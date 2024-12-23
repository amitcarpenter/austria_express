import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SeatManagement } from './SeatManagement';
import { Route } from './Route';
import { Bus } from './Bus';

@Entity()
export class Booking {
    @PrimaryGeneratedColumn()
    booking_id: number;

    @ManyToOne(() => SeatManagement, { nullable: false })
    seat: SeatManagement;

    @ManyToOne(() => Bus, { nullable: false })
    bus: Bus;

    @ManyToOne(() => Route, { nullable: false })
    route: Route;

    @Column()
    passenger_first_name: string;

    @Column()
    passenger_last_name: string;

    @Column()
    passenger_contact: string;

    @Column()
    passenger_viber_number: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    fare: number;

    @Column({ nullable: true })
    payment_reference: string;

    @Column({ type: 'timestamp', nullable: false })
    travel_date: Date;

    @Column({ type: 'time', nullable: true })
    departure_time: string;

    @Column({ type: 'time', nullable: true })
    arrival_time: string;

    @Column({ type: 'boolean', default: false })
    is_refundable: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
