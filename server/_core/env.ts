export const ENV = {
  appId: process.env.VITE_APP_ID ?? "lulubaby-app",
  cookieSecret: process.env.JWT_SECRET ?? "lulubaby-dev-secret-key-2024",
  JWT_SECRET: process.env.JWT_SECRET ?? "lulubaby-dev-secret-key-2024",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENAI_BASE_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};
