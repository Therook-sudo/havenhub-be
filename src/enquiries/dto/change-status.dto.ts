import { EnquiryStatus } from "@/entities/enums";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export class ChangeStatusDto {
  @ApiProperty({ example: "PENDING" })
  @IsEnum(EnquiryStatus)
  status!: EnquiryStatus;
}