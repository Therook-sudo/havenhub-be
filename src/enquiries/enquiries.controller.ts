import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../entities/User.entity";
import { EnquiriesService } from "./enquiries.service";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { BatchThreadsDto } from "./dto/batch-threads.dto";

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

  @Patch("threads/read-all")
  @ApiOperation({
    summary: "Mark Multiple or All Conversation Threads as Read (Batch)",
    description:
      "Mark a list of thread IDs as read by passing { threadIds: ['...'] } in the body, or omit the body to mark ALL unread threads for the current user as read.",
  })
  @ApiBody({ type: BatchThreadsDto, required: false })
  markThreadsAsRead(
    @CurrentUser() user: User,
    @Body() dto?: BatchThreadsDto,
  ) {
    return this.enquiriesService.markThreadsAsRead(user, dto);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark All User Enquiry Threads as Read (Alias)" })
  @ApiBody({ type: BatchThreadsDto, required: false })
  markAllAsReadAlias(
    @CurrentUser() user: User,
    @Body() dto?: BatchThreadsDto,
  ) {
    return this.enquiriesService.markThreadsAsRead(user, dto);
  }

  @Patch("threads/:threadId/read-all")
  @ApiOperation({ summary: "Mark All Messages in a Single Thread as Read" })
  @ApiParam({ name: "threadId", description: "Enquiry Thread ID" })
  markSingleThreadAsRead(
    @CurrentUser() user: User,
    @Param("threadId") threadId: string,
  ) {
    return this.enquiriesService.markThreadAsRead(user, threadId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark Single Enquiry Message as Read" })
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

  @Delete("threads/batch")
  @ApiOperation({
    summary: "Archive or Delete Multiple Conversation Threads (Batch)",
    description:
      "Archive a list of threads by passing { threadIds: ['...'] }. Set ?permanent=true to permanently delete.",
  })
  @ApiBody({ type: BatchThreadsDto })
  @ApiQuery({ name: "permanent", required: false, type: Boolean })
  deleteThreadsBatch(
    @CurrentUser() user: User,
    @Body() dto: BatchThreadsDto,
    @Query("permanent") permanent?: string,
  ) {
    if (permanent === "true" || permanent === "1") {
      return this.enquiriesService.deleteThreads(user, dto);
    }
    return this.enquiriesService.archiveThreads(user, dto);
  }

  @Delete("threads/:threadId")
  @ApiOperation({
    summary: "Delete Conversation Thread Permanently",
    description: "Permanently removes the entire enquiry conversation thread for this property/user.",
  })
  @ApiParam({ name: "threadId", description: "Enquiry Thread ID" })
  deleteThread(
    @CurrentUser() user: User,
    @Param("threadId") threadId: string,
  ) {
    return this.enquiriesService.deleteThread(threadId, user);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Archive Enquiry Thread",
    description: "Archive an enquiry thread. Set ?permanent=true to permanently delete.",
  })
  @ApiParam({ name: "id", description: "Enquiry ID or Thread ID" })
  @ApiQuery({ name: "permanent", required: false, type: Boolean })
  archiveThread(
    @Param("id") id: string,
    @CurrentUser() user: User,
    @Query("permanent") permanent?: string,
  ) {
    if (permanent === "true" || permanent === "1") {
      return this.enquiriesService.deleteThread(id, user);
    }
    return this.enquiriesService.archiveThread(id, user);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get Total Unread Enquiry Count" })
  getUnreadCount(@CurrentUser() user: User) {
    return this.enquiriesService.getUnreadCount(user);
  }
}
