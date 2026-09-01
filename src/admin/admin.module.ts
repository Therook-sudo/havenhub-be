import { Enquiry } from '../entities/Enquiry.entity';
import { Property } from '../entities/Property.entity';
import { User } from '@/entities/User.entity';
import { AuditLog } from '@/entities/AuditLog.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminPropertiesController } from './admin-properties.controller';
import { AdminPropertiesService } from './admin-properties.service';
import { AuditLogService } from '@/audit-log/audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Property, Enquiry, AuditLog])],
  controllers: [AdminController, AdminPropertiesController],
  providers: [AdminService, AdminPropertiesService, AuditLogService],
  exports: [AdminService, AdminPropertiesService],
})
export class AdminModule {}
