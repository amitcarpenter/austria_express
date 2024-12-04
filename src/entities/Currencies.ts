import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Currencies {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    currency_code: string;

    @Column({ unique: true })
    exchange_rate: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
