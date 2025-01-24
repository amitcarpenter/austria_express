import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

@Entity()
export class Route {
    @PrimaryGeneratedColumn()
    route_id: number;

    @Column({ type: 'enum', enum: ['Austria to Ukraine', 'Ukraine to Austria'] })
    route_direction: string;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
