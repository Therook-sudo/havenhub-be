import { ConfigService } from '@nestjs/config';
import { ListingStatus } from '../entities/enums';

/** Environment variable backing the auto-approve feature flag. */
export const DEV_AUTO_APPROVE_LISTINGS = 'DEV_AUTO_APPROVE_LISTINGS';

/** Config path exposed by `src/config/configuration.ts`. */
export const DEV_AUTO_APPROVE_LISTINGS_PATH = 'featureFlags.devAutoApproveListings';

/**
 * Coerce an environment-style value into a boolean.
 * Only the literal string "true" (any casing, surrounding whitespace ignored)
 * enables a flag — anything else, including an unset value, is false.
 */
export function parseBooleanFlag(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).trim().toLowerCase() === 'true';
}

/**
 * Read DEV_AUTO_APPROVE_LISTINGS, preferring the parsed `configuration()` value
 * and falling back to the raw environment variable when config is unavailable.
 */
export function isDevAutoApproveEnabled(configService?: ConfigService): boolean {
  const parsed = configService?.get(DEV_AUTO_APPROVE_LISTINGS_PATH);
  if (typeof parsed === 'boolean') return parsed;

  const raw =
    configService?.get<string>(DEV_AUTO_APPROVE_LISTINGS) ??
    process.env[DEV_AUTO_APPROVE_LISTINGS];

  return parseBooleanFlag(raw);
}

/**
 * Status a brand new listing is created with:
 * APPROVED when the dev auto-approve flag is on, PENDING_REVIEW otherwise.
 */
export function resolveNewListingStatus(configService?: ConfigService): ListingStatus {
  return isDevAutoApproveEnabled(configService)
    ? ListingStatus.APPROVED
    : ListingStatus.PENDING_REVIEW;
}
