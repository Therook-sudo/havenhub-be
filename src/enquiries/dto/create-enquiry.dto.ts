import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateEnquiryDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}