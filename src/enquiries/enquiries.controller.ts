import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/User.entity';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.create(user.id, dto);
  }

  @Get('threads')
  getThreads(@CurrentUser() user: User) {
    return this.enquiriesService.getThreads(user);
  }

  @Get('threads/:threadId')
  getThreadMessages(
    @CurrentUser() user: User,
    @Param('threadId') threadId: string,
  ) {
    return this.enquiriesService.getThreadMessages(user, threadId);
  }
}