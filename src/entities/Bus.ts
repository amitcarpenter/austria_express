import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Bus {
    @PrimaryGeneratedColumn()
    bus_id: number;

    @Column({ unique: true })
    bus_name: string;

    @Column({ unique: true })
    bus_number_plate: string;

    @Column({ nullable: true })
    bus_registration_number: string;

    @Column({ type: 'integer' })
    number_of_seats: number;

    @Column({ type: 'enum', enum: ['Sleeper', 'Seater', 'AC', 'Non-AC'], default: 'Seater' })
    bus_type: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
