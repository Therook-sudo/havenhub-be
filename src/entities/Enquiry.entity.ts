import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { EnquiryStatus } from "./enums";
import { Property } from "./Property.entity";
import { User } from "./User.entity";

@Entity("enquiries")
export class Enquiry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  message!: string;

  @Column({
    type: "enum",
    enum: EnquiryStatus,
    default: EnquiryStatus.PENDING,
  })
  status!: EnquiryStatus;

  @Column({default: false})
  isRead!: boolean;

  @Column({default: false})
  isArchived!: boolean;

  @Column()
  propertyId!: string;

  @ManyToOne(() => Property, (property) => property.enquiries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "propertyId" })
  property!: Property;

  @Column()
  seekerId!: string;

  @ManyToOne(() => User, (user) => user.enquiriesSent, { onDelete: "CASCADE" })
  @JoinColumn({ name: "seekerId" })
  seeker!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
