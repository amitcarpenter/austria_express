import { Entity, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from './Booking';

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    transaction_id: number;

    @Column({ nullable: true })
    transaction_number: string;

    @ManyToOne(() => Booking, { nullable: false, onDelete: "CASCADE" })
    booking: Booking;

    @Column({ nullable: false })
    amount: number;

    @Column({ nullable: true })
    payment_method: string;

    @Column({ nullable: true })
    payment_type: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
