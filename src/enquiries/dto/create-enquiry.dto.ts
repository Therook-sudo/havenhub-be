import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateEnquiryDto {
  @ApiPropertyOptional({ example: '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa', description: 'Property UUID' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({ example: '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa', description: 'Thread/Root Enquiry UUID' })
  @IsOptional()
  @IsUUID()
  threadId?: string;

  @ApiPropertyOptional({ example: '3f6d1a2e-9c47-4b1d-8a5e-2f0c7b91d4aa', description: 'Tenant/Seeker UUID' })
  @IsOptional()
  @IsUUID()
  seekerId?: string;

  @ApiProperty({ example: 'I would love to rent this house', description: 'Message body' })
  @IsString()
  @IsNotEmpty({ message: 'Message body cannot be empty' })
  message!: string;
}
