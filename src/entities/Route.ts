import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    start_location: string;

    @Column()
    end_location: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
