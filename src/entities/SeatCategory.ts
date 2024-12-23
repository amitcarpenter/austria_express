import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity()
export class SeatCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    category_name: string;

    @Column({ type: 'float', nullable: true })
    discount_percentage: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
