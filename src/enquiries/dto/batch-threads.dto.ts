import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class BatchThreadsDto {
  @ApiPropertyOptional({
    type: [String],
    example: ["576c8fbd-d222-4856-b6a9-445b0beac0e1"],
    description: "Array of Thread UUIDs (or Enquiry IDs) to process in batch",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  threadIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ["576c8fbd-d222-4856-b6a9-445b0beac0e1"],
    description: "Alias for threadIds",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}
