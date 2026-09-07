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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
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
  @ApiOperation({
    summary: "Send Enquiry or Thread Reply",
    description:
      "Send a new property enquiry (tenant) or reply to an existing enquiry thread (landlord/tenant). Accepts { propertyId, message } or { threadId, message }.",
  })
  @ApiResponse({ status: 201, description: "Message sent and stored in thread" })
  create(@CurrentUser() user: User, @Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.create(user, dto);
  }

  @Post("reply")
  @ApiOperation({ summary: "Reply to Enquiry Thread" })
  reply(@CurrentUser() user: User, @Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.create(user, dto);
  }

  @Post("threads/:threadId/messages")
  @ApiOperation({ summary: "Post Message to Specific Thread" })
  @ApiParam({ name: "threadId", description: "Enquiry Thread ID" })
  postThreadMessage(
    @CurrentUser() user: User,
    @Param("threadId") threadId: string,
    @Body() dto: CreateEnquiryDto,
  ) {
    return this.enquiriesService.create(user, { ...dto, threadId });
  }

  @Post(":id/reply")
  @ApiOperation({ summary: "Reply to Specific Enquiry ID" })
  replyToEnquiry(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: CreateEnquiryDto,
  ) {
    return this.enquiriesService.create(user, { ...dto, threadId: id });
  }

  @Get("threads")
  @ApiOperation({ summary: "Get All Conversations / Threads for Current User" })
  getThreads(@CurrentUser() user: User) {
    return this.enquiriesService.getThreads(user);
  }

  @Get("threads/:threadId")
  @ApiOperation({ summary: "Get All Messages in a Conversation Thread" })
  @ApiParam({ name: "threadId", description: "Enquiry Thread ID" })
  getThreadMessages(
    @CurrentUser() user: User,
    @Param("threadId") threadId: string,
  ) {
    return this.enquiriesService.getThreadMessages(user, threadId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark Enquiry as Read" })
  markAsRead(@Param("id") id: string, @CurrentUser() user: User) {
    return this.enquiriesService.markAsRead(id, user);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update Enquiry Status (Pending/Accepted/Declined)" })
  changeStatus(
    @Param("id") id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.enquiriesService.changeStatus(id, dto, user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Archive Enquiry Thread" })
  archiveThread(@Param("id") id: string, @CurrentUser() user: User) {
    return this.enquiriesService.archiveThread(id, user);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get Total Unread Enquiry Count" })
  getUnreadCount(@CurrentUser() user: User) {
    return this.enquiriesService.getUnreadCount(user);
  }

  @Patch("threads/:threadId/read-all")
  @ApiOperation({ summary: "Mark All Messages in a Thread as Read" })
  markThreadAsRead(
    @CurrentUser() user: User,
    @Param("threadId") threadId: string,
  ) {
    return this.enquiriesService.markThreadAsRead(user, threadId);
  }
}
