import { IsString, MaxLength, MinLength } from 'class-validator';

export class SummarizeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000, { message: 'description must not exceed 2000 characters' })
  description!: string;
}