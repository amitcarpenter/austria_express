import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    reseller_id: number;

    @ManyToOne(() => User, { nullable: true })
    user: User;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    company_name: string;

    @Column({ nullable: true })
    commission_rate: string;

    @Column({ nullable: true, default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
