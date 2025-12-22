import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

type MonitorApiRouteOptions = {
  route: string; // e.g. "/api/generate-code"
  method: string; // e.g. "POST"
  request?: NextRequest;
  tags?: Record<string, string | number | boolean | null | undefined>;
};

function toStringTags(
  tags: Record<string, string | number | boolean | null | undefined>
) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tags)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}

function sentryMetrics() {
  return (Sentry as unknown as { metrics?: any }).metrics;
}

function incrementMetric(
  name: string,
  value: number,
  tags: Record<string, string>
) {
  const metrics = sentryMetrics();
  if (metrics && typeof metrics.increment === "function") {
    metrics.increment(name, value, { tags });
  }
}

function distributionMetric(
  name: string,
  value: number,
  tags: Record<string, string>
) {
  const metrics = sentryMetrics();
  if (metrics && typeof metrics.distribution === "function") {
    metrics.distribution(name, value, { tags });
  }
}

export async function monitorApiRoute<TResponse extends Response>(
  opts: MonitorApiRouteOptions,
  handler: () => Promise<TResponse>
): Promise<TResponse> {
  const startMs = Date.now();
  const baseTags = toStringTags({
    route: opts.route,
    method: opts.method,
    ...(opts.tags || {}),
  });

  // Count hits regardless of outcome (best effort).
  incrementMetric("api.hit", 1, baseTags);

  return await Sentry.withScope(async (scope) => {
    scope.setTag("api.route", opts.route);
    scope.setTag("http.method", opts.method);
    for (const [k, v] of Object.entries(baseTags)) {
      scope.setTag(`api.${k}`, v);
    }

    if (opts.request) {
      try {
        const url = new URL(opts.request.url);
        scope.setTag("http.target", url.pathname);
      } catch {
        // ignore
      }
    }

    try {
      const res = await handler();
      const elapsed = Date.now() - startMs;
      distributionMetric("api.latency_ms", elapsed, baseTags);

      const status = (res as unknown as { status?: number }).status;
      if (typeof status === "number") {
        scope.setTag("http.status_code", String(status));
        incrementMetric(status >= 500 ? "api.failure" : "api.success", 1, {
          ...baseTags,
          status: String(status),
        });
      }

      return res;
    } catch (err) {
      const elapsed = Date.now() - startMs;
      distributionMetric("api.latency_ms", elapsed, baseTags);
      incrementMetric("api.exception", 1, baseTags);
      Sentry.captureException(err);
      throw err;
    }
  });
}
