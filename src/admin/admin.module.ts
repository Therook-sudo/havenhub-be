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
import { AuditLogModule } from '@/audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Property, 
      Enquiry,
    ]),
    AuditLogModule,
  ],
  controllers: [AdminController, AdminPropertiesController],
  providers: [AdminService, AdminPropertiesService],
  exports: [AdminService, AdminPropertiesService],
})
export class AdminModule {}
