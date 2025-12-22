import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

const parseSampleRate = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
  sendDefaultPii: false,
});


