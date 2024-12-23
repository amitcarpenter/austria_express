import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SeatManagement } from './SeatManagement';
import { Route } from './Route';

@Entity()
export class SeatAvailability {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Route, { nullable: false })
    route: Route; // Route linked to the availability

    @ManyToOne(() => SeatManagement, { nullable: false })
    seat: SeatManagement; // Specific seat

    @Column({ type: 'date', nullable: false })
    travel_date: Date; // Date of travel

    @Column({ type: 'integer', nullable: false })
    from_stop: number; // Starting stop ID for the journey

    @Column({ type: 'integer', nullable: false })
    to_stop: number; // Ending stop ID for the journey

    @Column({ type: 'enum', enum: ['available', 'booked'], default: 'available' })
    status: 'available' | 'booked'; // Seat status

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
