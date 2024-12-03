import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Role {
    @PrimaryGeneratedColumn()
    role_id: number;

    @Column({ length: 50 })
    role_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
