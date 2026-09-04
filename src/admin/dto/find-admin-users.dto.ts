import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { Role } from "@/entities";

export class FindAdminUserDto {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isSuspended?: boolean;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isVerified?: boolean;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 20;

}