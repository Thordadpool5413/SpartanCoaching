import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    // HSP-18: never ship free-text note/transcript bodies via request logs
    "req.body.notes",
    "req.body.transcript",
    "req.body.message",
    "req.body.prompt",
    "req.body.input",
    "req.body.text",
    "req.body.content",
    "req.body.password",
    "req.body.token",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
