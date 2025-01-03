import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Tbl_Contact_Us {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    contact_number: string;

    @Column()
    email: string;

    @Column({ type: 'text' })
    message: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}