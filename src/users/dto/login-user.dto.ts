import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginUserDto {
  @ApiProperty({ example: "test@havenhub.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "havenhub" })
  @IsString()
  @MinLength(8)
  password!: string;
}
