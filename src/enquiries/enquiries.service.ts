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
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Enquiry } from "../entities/Enquiry.entity";
import { Property } from "../entities/Property.entity";
import { User } from "../entities/User.entity";
import { EnquiryStatus, Role } from "../entities/enums";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";

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
      throw new NotFoundException("Property not found");
    }

    const enquiry = this.enquiryRepository.create({
      ...dto,
      seekerId,
      status: EnquiryStatus.PENDING,
      isRead: false,
      isArchived: false,
    });

    return this.enquiryRepository.save(enquiry);
  }

  async getThreads(user: User) {
    const isLandlord = user.role === Role.LANDLORD;

    const enquiries = await this.enquiryRepository.find({
      where: isLandlord
        ? { property: { landlordId: user.id }, isArchived: false }
        : { seekerId: user.id, isArchived: false },
      relations: ["property", "seeker"],
      order: { createdAt: "DESC" },
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

  async getThreadMessages(
    user: User,
    threadId: string,
  ): Promise<Partial<Enquiry>[]> {
    const rootEnquiry = await this.enquiryRepository.findOne({
      where: { id: threadId },
      relations: ["property"],
    });

    if (!rootEnquiry) {
      throw new NotFoundException("Thread not found");
    }

    const isSeeker = rootEnquiry.seekerId === user.id;
    const isLandlord = rootEnquiry.property.landlordId === user.id;

    if (!isSeeker && !isLandlord) {
      throw new ForbiddenException("You do not have access to this thread");
    }

    const messages = await this.enquiryRepository.find({
      where: {
        propertyId: rootEnquiry.propertyId,
        seekerId: rootEnquiry.seekerId,
      },
      relations: ["seeker"],
      order: { createdAt: "ASC" },
    });

    return messages.map((m) => ({
      ...m,
      seeker: m.seeker
        ? ({ ...m.seeker, passwordHash: undefined } as any)
        : undefined,
    }));
  }

  async markAsRead(id: string, user: User) {
    const enquiry = await this.enquiryRepository.findOne({
      where: { id },
      relations: ["property"],
    });

    if (!enquiry) {
      throw new NotFoundException("Enquiry thread not found");
    }

    const isLandlord = enquiry.property.landlordId === user.id;
    const isSeeker = enquiry.seekerId === user.id;

    if (!isLandlord && !isSeeker) {
      throw new ForbiddenException("You don't have access to this thread.");
    }

    await this.enquiryRepository.update({ id }, { isRead: true });

    return this.enquiryRepository.findOneBy({ id });
  }

  async changeStatus(id: string, dto: ChangeStatusDto, user: User) {
    const enquiry = await this.enquiryRepository.findOne({
      where: { id },
      relations: ["property"],
    });

    if (!enquiry) {
      throw new NotFoundException("Enquiry thread not found");
    }

    if (enquiry.property.landlordId !== user.id) {
      throw new ForbiddenException("You don't have access to this thread.");
    }

    Object.assign(enquiry, dto);

    const savedEnquiry = await this.enquiryRepository.save(enquiry);

    return savedEnquiry;
  }

  async archiveThread(id: string, user: User) {
    const enquiry = await this.enquiryRepository.findOne({
      where: { id },
      relations: ["property"],
    });

    if (!enquiry) {
      throw new NotFoundException("Enquiry thread not found");
    }

    const isLandlord = enquiry.property.landlordId === user.id;
    const isSeeker = enquiry.seekerId === user.id;

    if (!isLandlord && !isSeeker) {
      throw new ForbiddenException("You don't have access to this thread.");
    }

    await this.enquiryRepository.update(
      { propertyId: enquiry.propertyId, seekerId: enquiry.seekerId },
      { isArchived: true },
    );

    return { message: "Thread archived successfully" };
  }

  async getUnreadCount(user: User): Promise<{ unreadCount: number }> {
    if (user.role !== Role.LANDLORD) {
      return { unreadCount: 0 };
    }

    const unreadCount = await this.enquiryRepository.count({
      where: {
        property: { landlordId: user.id },
        isRead: false,
        isArchived: false,
      },
    });

    return { unreadCount };
  }

  async markThreadAsRead(
    user: User,
    threadId: string,
  ): Promise<{ message: string; updatedCount: number }> {
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

    const result = await this.enquiryRepository.update(
      {
        propertyId: rootEnquiry.propertyId,
        seekerId: rootEnquiry.seekerId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return {
      message: 'Thread marked as read',
      updatedCount: result.affected ?? 0,
    };
  }
}
