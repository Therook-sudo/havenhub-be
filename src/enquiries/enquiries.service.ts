export interface ThreadSummary {
  threadId: string;
  propertyId: string;
  seekerId: string;
  lastMessage: Enquiry;
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enquiry } from '../entities/Enquiry.entity';
import { Property } from '../entities/Property.entity';
import { User } from '../entities/User.entity';
import { Role } from '../entities/enums';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Injectable()
export class EnquiriesService {
  constructor(
    @InjectRepository(Enquiry)
    private readonly enquiryRepository: Repository<Enquiry>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async create(seekerId: string, dto: CreateEnquiryDto): Promise<Enquiry> {
    const property = await this.propertyRepository.findOne({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const enquiry = this.enquiryRepository.create({
      propertyId: dto.propertyId,
      seekerId,
      message: dto.message,
    });

    return this.enquiryRepository.save(enquiry);
  }

  async getThreads(user: User) {
  const isLandlord = user.role === Role.LANDLORD;

  const enquiries = await this.enquiryRepository.find({
    where: isLandlord
      ? { property: { landlordId: user.id } }
      : { seekerId: user.id },
    relations: ['property', 'seeker'],
    order: { createdAt: 'ASC' },
  });

  const threadMap = new Map<string, ThreadSummary>();

  for (const enquiry of enquiries) {
    const key = `${enquiry.propertyId}:${enquiry.seekerId}`;
    const existing = threadMap.get(key);

    if (!existing) {
      threadMap.set(key, {
        threadId: enquiry.id,
        propertyId: enquiry.propertyId,
        seekerId: enquiry.seekerId,
        lastMessage: enquiry,
      });
    } else {
      existing.lastMessage = enquiry;
    }
  }

  return Array.from(threadMap.values())
  .sort(
    (a, b) =>
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
  )
  .map((thread) => ({
    ...thread,
    lastMessage: {
      ...thread.lastMessage,
      seeker: thread.lastMessage.seeker
        ? ({ ...thread.lastMessage.seeker, passwordHash: undefined } as any)
        : undefined,
    },
  }));
}

  async getThreadMessages(user: User, threadId: string): Promise<Partial<Enquiry>[]> {
  const rootEnquiry = await this.enquiryRepository.findOne({
    where: { id: threadId },
    relations: ['property'],
  });

  if (!rootEnquiry) {
    throw new NotFoundException('Thread not found');
  }

  const isSeeker = rootEnquiry.seekerId === user.id;
  const isLandlord = rootEnquiry.property.landlordId === user.id;

  if (!isSeeker && !isLandlord) {
    throw new ForbiddenException('You do not have access to this thread');
  }

  const messages = await this.enquiryRepository.find({
    where: {
      propertyId: rootEnquiry.propertyId,
      seekerId: rootEnquiry.seekerId,
    },
    relations: ['seeker'],
    order: { createdAt: 'ASC' },
  });

  return messages.map((m) => ({
        ...m,
        seeker: m.seeker
        ? ({ ...m.seeker, passwordHash: undefined } as any)
        : undefined,
    }));
  }
}