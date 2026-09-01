import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/AuditLog.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Record an administrative action into the audit trail.
   */
  async logAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId?: string,
    details?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    try {
      const log = this.auditLogRepository.create({
        adminId,
        action,
        targetType,
        targetId,
        details,
        metadata,
      });

      const saved = await this.auditLogRepository.save(log);
      this.logger.log(`AuditLog [${action}] by Admin (${adminId}) on ${targetType}:${targetId || 'N/A'}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to record audit log: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Fetch paginated audit logs with rich filters for administrators.
   */
  async findAll(queryDto: QueryAuditLogDto) {
    const {
      page = 1,
      limit = 10,
      action,
      targetType,
      adminId,
      targetId,
      search,
      startDate,
      endDate,
    } = queryDto;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .select([
        'log',
        'admin.id',
        'admin.firstName',
        'admin.lastName',
        'admin.email',
        'admin.role',
      ]);

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    if (targetType) {
      queryBuilder.andWhere('log.targetType = :targetType', { targetType });
    }

    if (adminId) {
      queryBuilder.andWhere('log.adminId = :adminId', { adminId });
    }

    if (targetId) {
      queryBuilder.andWhere('log.targetId = :targetId', { targetId });
    }

    if (search && search.trim().length > 0) {
      queryBuilder.andWhere(
        '(LOWER(log.action) LIKE LOWER(:search) OR LOWER(COALESCE(log.details, \'\')) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` },
      );
    }

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: new Date(endDate) });
    }

    const validLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const validPage = Math.max(Number(page) || 1, 1);
    const skip = (validPage - 1) * validLimit;

    queryBuilder.orderBy('log.createdAt', 'DESC').skip(skip).take(validLimit);

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / validLimit) || 1;

    return {
      items,
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
}
