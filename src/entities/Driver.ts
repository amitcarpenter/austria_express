import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Driver {
    @PrimaryGeneratedColumn()
    driver_id: number;

    @Column()
    driver_name: string;

    @Column({ unique: true })
    driver_license_number: string;

    @Column()
    driver_contact_number: string;

    @Column({ nullable: true })
    driver_address: string;

    @Column({ type: 'date', nullable: true })
    driver_dob: Date;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ nullable: true })
    driver_profile_picture: string;

    @Column({ type: 'float', default: 0 })
    driver_rating: number;

    @Column({ type: 'date', nullable: true })
    license_expiry_date: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
