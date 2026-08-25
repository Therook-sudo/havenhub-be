import {
  IsNotEmpty,
  IsString,
  IsUUID,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEnquiryDto {
  @ApiProperty({example: '12345'})
  @IsUUID()
  @IsNotEmpty()
  propertyId!: string;

  @ApiProperty({example: 'I would love to rent this house'})
  @IsString()
  @IsNotEmpty()
  message!: string;
}
