import { NextRequest, NextResponse } from "next/server";
import { evaluateArchitecture } from "@/lib/ai/gemini-client";
import { ArchitectureBlueprint } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { monitorApiRoute } from "@/lib/monitoring/api-monitoring";
import * as Sentry from "@sentry/nextjs";
import { getUserTokenQuota } from "@/lib/utils/token-quota";

export async function POST(request: NextRequest) {
  return monitorApiRoute(
    { route: "/api/chat", method: "POST", request },
    async () => {
      try {
        const { message, architecture, architectureId } = await request.json();

        if (!message || typeof message !== "string") {
          return NextResponse.json(
            { error: "Message is required" },
            { status: 400 }
          );
        }

        if (!architecture) {
          return NextResponse.json(
            { error: "Architecture context is required for evaluation" },
            { status: 400 }
          );
        }

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }

        if (!db) {
          return NextResponse.json(
            { error: "Database connection unavailable" },
            { status: 503 }
          );
        }

        const quota = await getUserTokenQuota(user.id);
        if (quota.tokensLeft <= 0) {
          return NextResponse.json(
            {
              error: "Token limit reached",
              redirect: "/support-my-work",
              quota,
            },
            { status: 403 }
          );
        }

        const result = await evaluateArchitecture(
          architecture as ArchitectureBlueprint,
          message
        );

        // Track token usage
        await db.insert(schema.tokenUsage).values({
          userId: user.id,
          operation: "architecture_evaluation",
          inputTokens: result.tokenUsage.inputTokens,
          outputTokens: result.tokenUsage.outputTokens,
          totalTokens: result.tokenUsage.totalTokens,
          architectureId: architectureId ? parseInt(architectureId) : null,
        });

        return NextResponse.json({ reply: result.answer });
      } catch (error) {
        console.error("Error in chat API:", error);
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Failed to process chat request" },
          { status: 500 }
        );
      }
    }
  );
}
