import { Enquiry } from "../entities/Enquiry.entity";
import { Property } from "../entities/Property.entity";
import { ListingStatus } from "../entities/enums";
import { Role } from "../entities/enums";
import { User } from "../entities/User.entity";
import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogService } from "@/audit-log/audit-log.service";
import { FindAdminUserDto } from "./dto/find-admin-users.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userModel: Repository<User>,
    @InjectRepository(Property)
    private propertyModel: Repository<Property>,
    @InjectRepository(Enquiry)
    private enquiryModel: Repository<Enquiry>,

    private readonly auditLogService: AuditLogService,
  ) {}

  async getAdminAnalytics() {
    const [
      totalUsers,
      totalSeekers,
      totalLandlords,
      totalProperties,
      approvedProperties,
      pendingProperties,
      totalEnquiries,
    ] = await Promise.all([
      this.userModel.count(),
      this.userModel.count({
        where: { role: Role.PROPERTY_SEEKER },
      }),
      this.userModel.count({
        where: { role: Role.LANDLORD },
      }),
      this.propertyModel.count(),
      this.propertyModel.count({
        where: { status: ListingStatus.APPROVED },
      }),
      this.propertyModel.count({
        where: { status: ListingStatus.PENDING_REVIEW },
      }),
      this.enquiryModel.count(),
    ]);

    return {
      totalUsers,
      totalSeekers,
      totalLandlords,
      totalProperties,
      approvedProperties,
      pendingProperties,
      totalEnquiries,
    };
  }

  // getUsers()
  async getUsers(query: FindAdminUserDto) {
    const {
      role,
      isSuspended,
      isVerified,
      search,
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.userModel
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phoneNumber',
        'user.role',
        'user.isVerified',
        'user.suspensionReason',
        'user.suspendedAt',
        'user.avatarUrl',
        'user.createdAt',
        'user.updatedAt',
      ]);

      if (role) {
        queryBuilder.andWhere(
          'user.role = :role',
          {role},
        );
      }

      if (isSuspended !== undefined) {
        queryBuilder.andWhere(
          'user.isSuspended = :isSuspended',
          {isSuspended},
        );
      }

      if (isVerified !== undefined) {
        queryBuilder.andWhere(
          'user.isVerified = :isVerified',
          {isVerified},
        );
      }

      if (search?.trim()) {
        queryBuilder.andWhere(
          `(
            LOWER(user.firstName) LIKE LOWER(:search)
            OR LOWER(user.lastName) LIKE LOWER(:search)
            OR LOWER(user.email) LIKE LOWER(:search)
          )`,
          {
            search: `%${search.trim()}%`,
          },
        );
      }

      const validLimit = Math.min(
        Math.max(Number(limit) || 20, 1),
        100,
      );

      const validPage = Math.max(
        Number(page) || 1,
        1,
      );

      const skip = (validPage -1) * validLimit;

      queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip(skip)
        .take(validLimit);

      const [users, total] =
        await queryBuilder.getManyAndCount();

      const totalPages = 
        Math.ceil(total/validLimit) || 1;
        
        return{
          items: users,
          meta: {
            total,
            page: validPage,
            limit: validLimit,
            totalPages,
            hasNextPage: validPage < totalPages,
            hasPreviousPage: validPage > 1,
          },
        };
  }

  // suspendUser()
  async suspendUser(
    userId: string,
    reason: string,
    adminId: string,
  ) {
    const user = await this.userModel.findOne({
      where: {id: userId},
    });

    if(!user) {
      throw new NotFoundException(
        'User not found'
      );
    }

    if(user.isSuspended) {
      throw new ConflictException(
        'User account is already suspended',
      );
    }

    user.isSuspended = true;
    user.suspensionReason = reason;
    user.suspendedAt = new Date();

    const updatedUser = 
      await this.userModel.save(user);

    await this.auditLogService.logAction(
      adminId,
      'SUSPEND_USER',
      'USER',
      user.id,
      `User account suspended. Reason: ${reason}`,
      {
        reason,
        suspendedAt: updatedUser.suspendedAt,
      },
    );

    return{
      message: 'User account suspended successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isSuspended: updatedUser.isSuspended,
        suspensionReason:
          updatedUser.suspensionReason,
        suspendedAt: updatedUser.suspendedAt,
      },
    };
  }

  // activateUser()
  async activateUser(
    userId: string,
    adminId: string,
  ) {
    const user = await this.userModel.findOne({
      where: {id: userId},
    });

    if(!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if(!user.isSuspended) {
      throw new ConflictException(
        'User account is not suspended',
      );
    }

    const previousSuspensionReason = 
    user.suspensionReason;

    user.isSuspended = false;
    user.suspensionReason = null;
    user.suspendedAt = null;

    const updatedUser = 
      await this.userModel.save(user);

    await this.auditLogService.logAction(
      adminId,
      'ACTIVATE_USER',
      'USER',
      user.id,
      'User account reactivated',
      {
        previousSuspensionReason,
      },
    );

    return {
      message: 'User account activated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isSuspended: updatedUser.isSuspended,
        suspensionReason:
          updatedUser.suspensionReason,
        suspendedAt: updatedUser.suspendedAt,
      },
    };
  }
}
