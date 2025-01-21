import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity()
export class TicketType {
    @PrimaryGeneratedColumn()
    ticket_type_id: number;

    @Column({ unique: true })
    ticket_type: string

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
