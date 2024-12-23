import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class CityClosure {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    city_name: string;

    @Column({ type: 'timestamp' })
    start_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    end_date: Date;

    @Column({ type: 'boolean', default: false })
    is_permanent: boolean;

    @Column({ nullable: true })
    reason: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
