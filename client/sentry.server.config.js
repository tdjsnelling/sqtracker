import * as Sentry from "@sentry/nextjs";
import config from "../config";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment:
      process.env.NODE_ENV === "production" ? "production" : "development",
  });

  // Sentry.setContext('deployment', {
  //   name: config.envs.SQ_SITE_NAME,
  //   url: config.envs.SQ_BASE_URL,
  //   adminEmail: config.secrets.SQ_ADMIN_EMAIL,
  // })
}
