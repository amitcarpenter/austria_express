import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Route } from './Route';

@Entity()
export class Pricing {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Route, { nullable: false })
    route: Route;

    @Column({ type: 'float' })
    base_price: number;

    @Column({ type: 'integer' })
    discount_threshold: number;

    @Column({ type: 'float', nullable: true })
    discount_percentage: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
