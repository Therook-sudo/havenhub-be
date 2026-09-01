import { ConfigService } from '@nestjs/config';
import { ListingStatus } from '../entities/enums';
import {
  DEV_AUTO_APPROVE_LISTINGS,
  DEV_AUTO_APPROVE_LISTINGS_PATH,
  isDevAutoApproveEnabled,
  parseBooleanFlag,
  resolveNewListingStatus,
} from './feature-flags';
import configuration from './configuration';

/** Minimal ConfigService stand-in backed by a plain lookup table. */
const configStub = (values: Record<string, unknown>): ConfigService =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('DEV_AUTO_APPROVE_LISTINGS feature flag', () => {
  const originalEnv = process.env[DEV_AUTO_APPROVE_LISTINGS];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[DEV_AUTO_APPROVE_LISTINGS];
    } else {
      process.env[DEV_AUTO_APPROVE_LISTINGS] = originalEnv;
    }
  });

  describe('parseBooleanFlag', () => {
    it.each(['true', 'TRUE', 'True', ' true '])(
      'treats %p as enabled',
      (value) => {
        expect(parseBooleanFlag(value)).toBe(true);
      },
    );

    it.each(['false', 'FALSE', '0', '1', 'yes', 'no', 'anything'])(
      'treats %p as disabled',
      (value) => {
        expect(parseBooleanFlag(value)).toBe(false);
      },
    );

    it('passes through real booleans', () => {
      expect(parseBooleanFlag(true)).toBe(true);
      expect(parseBooleanFlag(false)).toBe(false);
    });

    it('falls back to the default when unset or empty', () => {
      expect(parseBooleanFlag(undefined)).toBe(false);
      expect(parseBooleanFlag(null)).toBe(false);
      expect(parseBooleanFlag('')).toBe(false);
      expect(parseBooleanFlag(undefined, true)).toBe(true);
    });
  });

  describe('configuration()', () => {
    it('exposes the flag as true when DEV_AUTO_APPROVE_LISTINGS=true', () => {
      process.env[DEV_AUTO_APPROVE_LISTINGS] = 'true';
      expect(configuration().featureFlags.devAutoApproveListings).toBe(true);
    });

    it('exposes the flag as false when DEV_AUTO_APPROVE_LISTINGS=false', () => {
      process.env[DEV_AUTO_APPROVE_LISTINGS] = 'false';
      expect(configuration().featureFlags.devAutoApproveListings).toBe(false);
    });

    it('defaults to false when the variable is not set', () => {
      delete process.env[DEV_AUTO_APPROVE_LISTINGS];
      expect(configuration().featureFlags.devAutoApproveListings).toBe(false);
    });
  });

  describe('isDevAutoApproveEnabled', () => {
    it('reads the parsed boolean from the config namespace', () => {
      const config = configStub({ [DEV_AUTO_APPROVE_LISTINGS_PATH]: true });
      expect(isDevAutoApproveEnabled(config)).toBe(true);
    });

    it('honours a false config value even when the raw env var says true', () => {
      process.env[DEV_AUTO_APPROVE_LISTINGS] = 'true';
      const config = configStub({ [DEV_AUTO_APPROVE_LISTINGS_PATH]: false });
      expect(isDevAutoApproveEnabled(config)).toBe(false);
    });

    it('falls back to the raw env var when config has no parsed value', () => {
      process.env[DEV_AUTO_APPROVE_LISTINGS] = 'true';
      expect(isDevAutoApproveEnabled(configStub({}))).toBe(true);

      process.env[DEV_AUTO_APPROVE_LISTINGS] = 'false';
      expect(isDevAutoApproveEnabled(configStub({}))).toBe(false);
    });

    it('reads process.env directly when no ConfigService is supplied', () => {
      process.env[DEV_AUTO_APPROVE_LISTINGS] = 'true';
      expect(isDevAutoApproveEnabled()).toBe(true);

      delete process.env[DEV_AUTO_APPROVE_LISTINGS];
      expect(isDevAutoApproveEnabled()).toBe(false);
    });
  });

  describe('resolveNewListingStatus', () => {
    it('resolves to APPROVED when the flag is on', () => {
      const config = configStub({ [DEV_AUTO_APPROVE_LISTINGS_PATH]: true });
      expect(resolveNewListingStatus(config)).toBe(ListingStatus.APPROVED);
    });

    it('resolves to PENDING_REVIEW when the flag is off', () => {
      const config = configStub({ [DEV_AUTO_APPROVE_LISTINGS_PATH]: false });
      expect(resolveNewListingStatus(config)).toBe(ListingStatus.PENDING_REVIEW);
    });

    it('resolves to PENDING_REVIEW when the flag is absent entirely', () => {
      delete process.env[DEV_AUTO_APPROVE_LISTINGS];
      expect(resolveNewListingStatus(configStub({}))).toBe(
        ListingStatus.PENDING_REVIEW,
      );
    });
  });
});
