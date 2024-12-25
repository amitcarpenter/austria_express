import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Driver } from './Driver';
import { Bus } from './Bus';

@Entity()
export class DriverBusAssignment {
    @PrimaryGeneratedColumn()
    assignment_id: number;

    @ManyToOne(() => Driver, { nullable: false })
    driver: Driver;

    @ManyToOne(() => Bus, { nullable: false })
    bus: Bus;

    @Column({ type: 'timestamp',nullable: true, })
    start_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    end_date: Date;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
