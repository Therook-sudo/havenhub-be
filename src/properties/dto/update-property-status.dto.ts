import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ListingStatus } from '../../entities/enums';

/**
 * Subset of {@link ListingStatus} an administrator may move a listing to
 * through the moderation endpoint. DRAFT and RENTED are lifecycle states
 * owned by the landlord, not moderation outcomes, so they are not accepted.
 */
export const MODERATION_STATUSES: ListingStatus[] = [
  ListingStatus.PENDING_REVIEW,
  ListingStatus.APPROVED,
  ListingStatus.REJECTED,
];

export class UpdatePropertyStatusDto {
  @ApiProperty({
    enum: MODERATION_STATUSES,
    enumName: 'PropertyModerationStatus',
    example: ListingStatus.APPROVED,
    description:
      'Moderation outcome for the listing.\n\n' +
      '- `PENDING_REVIEW` — return the listing to the moderation queue\n' +
      '- `APPROVED` — publish the listing to the public discovery feed\n' +
      '- `REJECTED` — reject the listing (supply `rejectionReason`)',
  })
  @IsIn(MODERATION_STATUSES, {
    message: `status must be one of: ${MODERATION_STATUSES.join(', ')}`,
  })
  status!: ListingStatus;

  @ApiPropertyOptional({
    maxLength: 500,
    example: 'Listing photos do not match the described property.',
    description:
      'Reason shown to the landlord. Only stored when `status` is `REJECTED`; ' +
      'any previously stored reason is cleared for the other statuses.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
