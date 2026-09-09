import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Enquiry } from "../entities/Enquiry.entity";
import { Property } from "../entities/Property.entity";
import { User } from "../entities/User.entity";
import { EnquiryStatus, Role } from "../entities/enums";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { BatchThreadsDto } from "./dto/batch-threads.dto";

export interface ThreadSummary {
  id: string;
  threadId: string;
  propertyId: string;
  seekerId: string;
  propertySubject: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  message: string;
  timestamp: string;
  createdAt: Date;
  updatedAt: Date;
  isRead: boolean;
  unreadCount: number;
  isArchived: boolean;
  property: Property;
  seeker?: User;
}

@Injectable()
export class EnquiriesService {
  constructor(
    @InjectRepository(Enquiry)
    private readonly enquiryRepository: Repository<Enquiry>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async create(user: User, dto: CreateEnquiryDto): Promise<any> {
    let propertyId = dto.propertyId;
    let seekerId: string;
    let property: Property | null = null;

    if (dto.threadId) {
      // Landlord or Tenant replying to an existing thread
      const rootEnquiry = await this.enquiryRepository.findOne({
        where: { id: dto.threadId },
        relations: ["property", "seeker"],
      });

      if (!rootEnquiry) {
        throw new NotFoundException("Enquiry thread not found");
      }

      propertyId = rootEnquiry.propertyId;
      seekerId = rootEnquiry.seekerId;
      property = rootEnquiry.property;

      const isSeeker = seekerId === user.id;
      const isLandlord = property?.landlordId === user.id;

      if (!isSeeker && !isLandlord) {
        throw new ForbiddenException(
          "You are not authorized to post in this enquiry thread",
        );
      }
    } else {
      if (!propertyId) {
        throw new BadRequestException("Either propertyId or threadId is required");
      }

      property = await this.propertyRepository.findOne({
        where: { id: propertyId },
      });

      if (!property) {
        throw new NotFoundException("Property not found");
      }

      const isLandlord = property.landlordId === user.id;

      if (isLandlord) {
        if (dto.seekerId) {
          seekerId = dto.seekerId;
        } else {
          const existingEnquiry = await this.enquiryRepository.findOne({
            where: { propertyId: property.id },
            order: { createdAt: "DESC" },
          });
          if (!existingEnquiry) {
            throw new BadRequestException(
              "Cannot reply: No existing enquiry found for this property.",
            );
          }
          seekerId = existingEnquiry.seekerId;
        }
      } else {
        seekerId = user.id;
      }
    }

    const isSenderLandlord = property?.landlordId === user.id;
    const senderRole = isSenderLandlord ? Role.LANDLORD : Role.PROPERTY_SEEKER;
    const senderType = isSenderLandlord ? "landlord" : "tenant";

    const enquiry = this.enquiryRepository.create({
      propertyId,
      seekerId,
      senderId: user.id,
      senderRole,
      message: dto.message,
      status: EnquiryStatus.PENDING,
      isRead: false,
      isArchived: false,
    });

    const saved = await this.enquiryRepository.save(enquiry);

    return {
      ...saved,
      text: saved.message,
      senderId: user.id,
      senderRole,
      senderType,
      sender: {
        id: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || (isSenderLandlord ? "Landlord" : "Tenant"),
        role: senderRole,
        avatar: user.avatarUrl || "images/Avatar 4.svg",
      },
    };
  }

  async getThreads(user: User): Promise<ThreadSummary[]> {
    const isLandlord = user.role === Role.LANDLORD;

    const enquiries = await this.enquiryRepository.find({
      where: isLandlord
        ? { property: { landlordId: user.id }, isArchived: false }
        : { seekerId: user.id, isArchived: false },
      relations: ["property", "property.landlord", "seeker"],
      order: { createdAt: "DESC" },
    });

    const threadMap = new Map<string, ThreadSummary>();

    for (const enquiry of enquiries) {
      const key = `${enquiry.propertyId}:${enquiry.seekerId}`;
      const existing = threadMap.get(key);

      if (!existing) {
        const otherParty = isLandlord ? enquiry.seeker : enquiry.property?.landlord;
        const otherPartyName = otherParty
          ? `${otherParty.firstName || ""} ${otherParty.lastName || ""}`.trim()
          : isLandlord
            ? "Verified Tenant"
            : "Landlord";

        threadMap.set(key, {
          id: enquiry.id,
          threadId: enquiry.id,
          propertyId: enquiry.propertyId,
          seekerId: enquiry.seekerId,
          propertySubject: enquiry.property?.title || "Property Enquiry",
          userName: otherPartyName,
          userAvatar: otherParty?.avatarUrl || "images/Avatar 4.svg",
          lastMessage: enquiry.message,
          message: enquiry.message,
          timestamp: enquiry.createdAt
            ? new Date(enquiry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
          createdAt: enquiry.createdAt,
          updatedAt: enquiry.updatedAt,
          isRead: enquiry.isRead,
          unreadCount: enquiry.isRead ? 0 : 1,
          isArchived: enquiry.isArchived,
          property: enquiry.property,
          seeker: enquiry.seeker
            ? ({ ...enquiry.seeker, passwordHash: undefined } as any)
            : undefined,
        });
      }
    }

    return Array.from(threadMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getThreadMessages(
    user: User,
    threadId: string,
  ): Promise<any[]> {
    const rootEnquiry = await this.enquiryRepository.findOne({
      where: { id: threadId },
      relations: ["property", "property.landlord", "seeker"],
    });

    if (!rootEnquiry) {
      throw new NotFoundException("Thread not found");
    }

    const isSeeker = rootEnquiry.seekerId === user.id;
    const isLandlord = rootEnquiry.property?.landlordId === user.id;

    if (!isSeeker && !isLandlord) {
      throw new ForbiddenException("You do not have access to this thread");
    }

    const messages = await this.enquiryRepository.find({
      where: {
        propertyId: rootEnquiry.propertyId,
        seekerId: rootEnquiry.seekerId,
      },
      relations: ["property", "property.landlord", "seeker"],
      order: { createdAt: "ASC" },
    });

    return messages.map((m) => {
      const isSenderLandlord =
        m.senderRole === Role.LANDLORD ||
        (m.senderId && m.senderId === rootEnquiry.property?.landlordId);

      const senderRole = isSenderLandlord ? Role.LANDLORD : Role.PROPERTY_SEEKER;
      const senderType = isSenderLandlord ? "landlord" : "tenant";
      const senderUser = isSenderLandlord
        ? rootEnquiry.property?.landlord
        : m.seeker;

      return {
        ...m,
        text: m.message,
        senderId:
          m.senderId ||
          (isSenderLandlord ? rootEnquiry.property?.landlordId : m.seekerId),
        senderRole,
        senderType,
        sender: senderUser
          ? {
              id: senderUser.id,
              name:
                `${senderUser.firstName || ""} ${senderUser.lastName || ""}`.trim() ||
                (isSenderLandlord ? "Landlord" : "Tenant"),
              role: senderRole,
              avatar: senderUser.avatarUrl || "images/Avatar 4.svg",
            }
          : undefined,
        seeker: m.seeker
          ? ({ ...m.seeker, passwordHash: undefined } as any)
          : undefined,
        time: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "12:00 PM",
      };
    });
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

    await this.enquiryRepository.update({ id }, { isRead: true, readAt: new Date() });

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

  async archiveThreads(user: User, dto?: BatchThreadsDto, threadId?: string) {
    const targetIds = dto?.threadIds || dto?.ids || (threadId ? [threadId] : []);

    if (targetIds.length === 0) {
      throw new BadRequestException("Please provide a list of threadIds to archive.");
    }

    let archivedCount = 0;
    for (const id of targetIds) {
      try {
        const enquiry = await this.enquiryRepository.findOne({
          where: { id },
          relations: ["property"],
        });

        if (enquiry) {
          const isLandlord = enquiry.property?.landlordId === user.id;
          const isSeeker = enquiry.seekerId === user.id;

          if (isLandlord || isSeeker) {
            await this.enquiryRepository.update(
              { propertyId: enquiry.propertyId, seekerId: enquiry.seekerId },
              { isArchived: true },
            );
            archivedCount++;
          }
        }
      } catch {}
    }

    return {
      message: `${archivedCount} thread(s) archived successfully`,
      archivedCount,
    };
  }

  async deleteThread(threadId: string, user: User) {
    const rootEnquiry = await this.enquiryRepository.findOne({
      where: { id: threadId },
      relations: ["property"],
    });

    if (!rootEnquiry) {
      throw new NotFoundException("Conversation thread not found");
    }

    const isSeeker = rootEnquiry.seekerId === user.id;
    const isLandlord = rootEnquiry.property?.landlordId === user.id;

    if (!isSeeker && !isLandlord) {
      throw new ForbiddenException("You do not have access to delete this conversation");
    }

    const result = await this.enquiryRepository.delete({
      propertyId: rootEnquiry.propertyId,
      seekerId: rootEnquiry.seekerId,
    });

    return {
      message: "Conversation thread deleted permanently",
      deletedCount: result.affected ?? 0,
    };
  }

  async deleteThreads(user: User, dto?: BatchThreadsDto) {
    const targetIds = dto?.threadIds || dto?.ids || [];

    if (targetIds.length === 0) {
      throw new BadRequestException("Please provide a list of threadIds to delete.");
    }

    let deletedCount = 0;
    for (const id of targetIds) {
      try {
        const rootEnquiry = await this.enquiryRepository.findOne({
          where: { id },
          relations: ["property"],
        });

        if (rootEnquiry) {
          const isSeeker = rootEnquiry.seekerId === user.id;
          const isLandlord = rootEnquiry.property?.landlordId === user.id;

          if (isSeeker || isLandlord) {
            const res = await this.enquiryRepository.delete({
              propertyId: rootEnquiry.propertyId,
              seekerId: rootEnquiry.seekerId,
            });
            deletedCount += res.affected ?? 0;
          }
        }
      } catch {}
    }

    return {
      message: "Conversation threads deleted permanently",
      deletedCount,
    };
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
      message: "Thread marked as read",
      updatedCount: result.affected ?? 0,
    };
  }

  async markThreadsAsRead(
    user: User,
    dto?: BatchThreadsDto,
  ): Promise<{ message: string; updatedCount: number }> {
    const targetIds = dto?.threadIds || dto?.ids;

    if (targetIds && targetIds.length > 0) {
      let totalUpdated = 0;
      for (const threadId of targetIds) {
        try {
          const res = await this.markThreadAsRead(user, threadId);
          totalUpdated += res.updatedCount;
        } catch {}
      }
      return {
        message: "Threads marked as read successfully",
        updatedCount: totalUpdated,
      };
    }

    // Mark ALL unread threads for the current user
    const isLandlord = user.role === Role.LANDLORD;
    const unreadEnquiries = await this.enquiryRepository.find({
      where: isLandlord
        ? { property: { landlordId: user.id }, isRead: false }
        : { seekerId: user.id, isRead: false },
      relations: ["property"],
    });

    if (unreadEnquiries.length === 0) {
      return { message: "No unread messages", updatedCount: 0 };
    }

    const idsToUpdate = unreadEnquiries.map((e) => e.id);
    const result = await this.enquiryRepository
      .createQueryBuilder()
      .update(Enquiry)
      .set({ isRead: true, readAt: new Date() })
      .where("id IN (:...ids)", { ids: idsToUpdate })
      .execute();

    return {
      message: "All threads marked as read",
      updatedCount: result.affected ?? 0,
    };
  }
}
