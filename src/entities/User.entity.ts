import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from './enums';
import { Property } from './Property.entity';
import { Enquiry } from './Enquiry.entity';
import { SavedProperty } from './SavedProperty.entity';
import { Report } from './Report.entity';
import { AuditLog } from './AuditLog.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.PROPERTY_SEEKER,
  })
  role: Role;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  avatarUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Property, (property) => property.landlord)
  listings: Property[];

  @OneToMany(() => Enquiry, (enquiry) => enquiry.seeker)
  enquiriesSent: Enquiry[];

  @OneToMany(() => SavedProperty, (saved) => saved.user)
  savedProperties: SavedProperty[];

  @OneToMany(() => Report, (report) => report.reporter)
  reportsSubmitted: Report[];

  @OneToMany(() => AuditLog, (log) => log.admin)
  auditLogs: AuditLog[];
}
