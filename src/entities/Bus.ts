import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
