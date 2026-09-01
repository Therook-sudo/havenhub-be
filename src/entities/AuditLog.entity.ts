import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { AuditTargetType } from './enums';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  adminId!: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminId' })
  admin!: User;

  @Column({
    type: 'varchar',
    length: 100,
  })
  action!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: AuditTargetType.PROPERTY,
  })
  targetType!: string;

  @Column({ nullable: true })
  targetId?: string;

  @Column('text', { nullable: true })
  details?: string;

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}
