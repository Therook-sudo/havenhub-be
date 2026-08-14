import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ListingStatus } from './enums';
import { User } from './User.entity';
import { Enquiry } from './Enquiry.entity';
import { SavedProperty } from './SavedProperty.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 12, scale: 2 })
  price: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  address?: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  propertyType: string;

  @Column('int')
  bedrooms: number;

  @Column('int')
  bathrooms: number;

  @Column('simple-array', { nullable: true })
  amenities: string[];

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.PENDING_REVIEW,
  })
  status: ListingStatus;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column()
  landlordId: string;

  @ManyToOne(() => User, (user) => user.listings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'landlordId' })
  landlord: User;

  @OneToMany(() => Enquiry, (enquiry) => enquiry.property)
  enquiries: Enquiry[];

  @OneToMany(() => SavedProperty, (saved) => saved.property)
  savedBy: SavedProperty[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
