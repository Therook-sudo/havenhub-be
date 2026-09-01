import { Role } from "@/entities/enums";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsString,
  MinLength,
} from "class-validator";

export class RegisterUserDto {
  @ApiProperty({example: 'test@havenhub.com'})
  @IsEmail()
  email!: string;

  @ApiProperty({example: 'havenhub'})
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({example: 'Haven'})
  @IsString()
  firstName!: string;

  @ApiProperty({example: 'Hub'})
  @IsString()
  lastName!: string;

  @ApiProperty({example: 'PROPERTY_SEEKER'})
  @IsEnum(Role)
  role!: Role;
}
