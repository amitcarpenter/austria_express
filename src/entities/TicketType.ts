import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity()
export class TicketType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: 'Adult' | 'Child' | 'Senior';

    @Column({ type: 'float', nullable: true })
    discount_percentage: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
