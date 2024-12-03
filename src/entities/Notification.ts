import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: false })
    user: User;

    @Column()
    type: string; // Email or SMS

    @Column()
    message: string;

    @Column({ type: 'boolean', default: false })
    is_sent: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
