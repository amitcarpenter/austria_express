import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    route_id: number;

    @Column({ unique: true })
    route_name: string;

    @Column()
    start_location: string;

    @Column()
    end_location: string;

    @Column({ type: 'float', nullable: true })
    distance_km: number;

    @Column({ type: 'integer', nullable: true })
    estimated_time: number;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
