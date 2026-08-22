export default () => ({
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/havenhub_db?schema=public',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'havenhub_dev_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  featureFlags: {
    // DEV_AUTO_APPROVE_LISTINGS=true bypasses the moderation queue so newly
    // created listings go straight to APPROVED (staging / local development).
    devAutoApproveListings:
      (process.env.DEV_AUTO_APPROVE_LISTINGS || '').trim().toLowerCase() === 'true',
  },
});
