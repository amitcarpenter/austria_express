import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Role } from './Role';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true, })
    mobile_number: string;

    @Column({ nullable: true })
    show_password: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true })
    profile_image: string;

    @Column({ nullable: true })
    jwt_token: string;

    @Column({ nullable: true, type: 'varchar', length: 64 })
    reset_password_token: string | null;

    @Column({ type: 'timestamp', nullable: true, default: null })
    reset_password_token_expiry: Date | null;

    @Column({ nullable: true, type: 'varchar', length: 64 })
    verify_token: string | null;

    @Column({ type: 'timestamp', nullable: true, default: null })
    verify_token_expiry: Date | null;

    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ nullable: true })
    signup_method: string;


    @ManyToOne(() => Role, { nullable: true })
    role: Role;


    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
