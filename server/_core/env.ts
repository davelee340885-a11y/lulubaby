export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "default-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Unified Stripe keys (single set for both Spark payments and domain purchases)
  stripeSecretKey: process.env.LULUBABY_STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.LULUBABY_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.LULUBABY_STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Separate webhook secret for domain purchase endpoint (/api/webhooks/stripe)
  stripeDomainWebhookSecret: process.env.STRIPE_DOMAIN_WEBHOOK_SECRET ?? process.env.LULUBABY_STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // SMTP for transactional emails (password reset, notifications)
  // Supports any SMTP provider (Titan Email, Gmail, SendGrid, etc.)
  smtpHost: process.env.SMTP_HOST ?? "smtp.titan.email",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "465", 10),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "",
};
