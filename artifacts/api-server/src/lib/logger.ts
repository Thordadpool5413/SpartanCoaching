import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Structured logger (HSP-43).
 * Redact auth secrets; never log request bodies at the HTTP layer (serializers omit them).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "res.headers['set-cookie']",
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "stripeCustomerId",
      "*.password",
      "*.token",
      "*.authorization",
      "*.cookie",
    ],
    remove: true,
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
