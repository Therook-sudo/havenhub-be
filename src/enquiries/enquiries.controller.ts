import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../entities/User.entity";
import { EnquiriesService } from "./enquiries.service";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";

@ApiTags("Enquiries")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("enquiries")
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.create(user.id, dto);
  }

  @Get("threads")
  getThreads(@CurrentUser() user: User) {
    return this.enquiriesService.getThreads(user);
  }

  @Get("threads/:threadId")
  getThreadMessages(
    @CurrentUser() user: User,
    @Param("threadId") threadId: string,
  ) {
    return this.enquiriesService.getThreadMessages(user, threadId);
  }

  @Patch(":id/read")
  markAsRead(@Param("id") id: string, @Req() req) {
    return this.enquiriesService.markAsRead(id, req.user);
  }

  @Patch(":id/status")
  changeStatus(
    @Param("id") id: string,
    @Body() dto: ChangeStatusDto,
    @Req() req,
  ) {
    return this.enquiriesService.changeStatus(id, dto, req.user);
  }

  @Delete(":id")
  archiveThread(@Param("id") id: string, @Req() req) {
    return this.enquiriesService.archiveThread(id, req.user);
  }
}
