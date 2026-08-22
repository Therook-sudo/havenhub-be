import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enquiry } from '../entities/Enquiry.entity';
import { Property } from '../entities/Property.entity';
import { EnquiriesController } from './enquiries.controller';
import { EnquiriesService } from './enquiries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Enquiry, Property])],
  controllers: [EnquiriesController],
  providers: [EnquiriesService],
})
export class EnquiriesModule {}