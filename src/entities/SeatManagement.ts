import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Bus } from './Bus';

@Entity()
export class SeatManagement {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Bus, { nullable: false })
    bus: Bus;

    @Column({ nullable: true })
    seat_number: string;

    // @Column({ type: 'enum', enum: ['economy', 'premium', 'luxury'] })
    // seat_type: 'economy' | 'premium' | 'luxury';

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
