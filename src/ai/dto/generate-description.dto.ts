import { IsString, MaxLength, MinLength } from 'class-validator';

// NOTE: Frontend (web landlord form) sends a single freeform text field,
// not structured attributes (propertyType/bedrooms/city/amenities).
// This DTO matches what the frontend actually sends today.
// If the form is later updated to structured fields, swap this DTO
// and update the prompt builder in ai.service.ts accordingly.
export class GenerateDescriptionDto {
  @IsString()
  @MinLength(3, { message: 'userInput must be at least 3 characters' })
  @MaxLength(2000, { message: 'userInput must not exceed 2000 characters' })
  userInput!: string;
}