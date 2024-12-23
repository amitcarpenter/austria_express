import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Route } from './Route';
import { Stop } from './Stop';
import { TicketType } from './TicketType';
import { SeatCategory } from './SeatCategory';

// @Entity()
// export class Pricing {
//     @PrimaryGeneratedColumn()
//     id: number;

//     @ManyToOne(() => Route, { nullable: false })
//     route: Route;

//     @Column({ type: 'enum', enum: ['economy', 'premium', 'luxury'], nullable: true })
//     ticket_type: 'economy' | 'premium' | 'luxury';

//     @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
//     base_price: number;

//     @Column({ type: 'boolean', default: false })
//     dynamic_pricing_enabled: boolean;

//     @Column({ type: 'json', nullable: true })
//     dynamic_pricing_rules: Record<string, any>;  

//     @Column({ type: 'varchar', default: 'USD' })
//     currency: string;

//     @Column({ type: 'integer' })
//     discount_threshold: number;

//     @Column({ type: 'integer' })
//     discount_based_seat: number;

//     @Column({ type: 'float', nullable: true })
//     discount_percentage: number;

//     @CreateDateColumn()
//     created_at: Date;

//     @UpdateDateColumn()
//     updated_at: Date;
// }


@Entity()
export class Pricing {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Route, { nullable: false })
    route: Route;

    @ManyToOne(() => Stop, { nullable: false })
    stop: Stop;

    @ManyToOne(() => TicketType, { nullable: false })
    ticket_type: TicketType;

    @ManyToOne(() => SeatCategory, { nullable: false })
    seat_category: SeatCategory;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    base_price: number;  // Base price for the ticket

    @Column({ type: 'boolean', default: false })
    dynamic_pricing_enabled: boolean;

    @Column({ type: 'json', nullable: true })
    dynamic_pricing_rules: Record<string, any>;  

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
