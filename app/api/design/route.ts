import { NextRequest, NextResponse } from "next/server";
import { generateArchitecture } from "@/lib/ai/gemini-client";
import { estimateCost } from "@/lib/utils/cost-estimator";
import { ArchitectureBlueprint } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { eq } from "drizzle-orm";
import { monitorApiRoute } from "@/lib/monitoring/api-monitoring";
import * as Sentry from "@sentry/nextjs";
import { getUserTokenQuota } from "@/lib/utils/token-quota";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return monitorApiRoute(
    { route: "/api/design", method: "POST", request },
    async () => {
      try {
        const { prompt, architectureId, existingArchitecture } =
          await request.json();

        if (!prompt || typeof prompt !== "string") {
          return NextResponse.json(
            { error: "Prompt is required" },
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

        let existingArch: ArchitectureBlueprint | undefined = undefined;
        let isIteration = false;

        // If architectureId is provided, fetch the existing architecture
        if (architectureId && typeof architectureId === "number") {
          const [existingArchRecord] = await db
            .select()
            .from(schema.architectures)
            .where(eq(schema.architectures.id, architectureId));

          if (!existingArchRecord) {
            return NextResponse.json(
              { error: "Architecture not found" },
              { status: 404 }
            );
          }

          // Verify ownership
          if (existingArchRecord.userId !== user.id) {
            return NextResponse.json(
              { error: "Unauthorized access to architecture" },
              { status: 403 }
            );
          }

          // Convert database record to ArchitectureBlueprint
          existingArch = {
            id: existingArchRecord.id.toString(),
            prompt: existingArchRecord.prompt,
            services: existingArchRecord.services as any,
            connections: existingArchRecord.connections as any,
            patterns: existingArchRecord.patterns as any,
            scaling_model: existingArchRecord.scalingModel as any,
            summary: existingArchRecord.summary || "",
            estimated_cost: existingArchRecord.estimatedCost as any,
            created_at: existingArchRecord.createdAt.toISOString(),
            updated_at: existingArchRecord.updatedAt.toISOString(),
          };
          isIteration = true;
        } else if (
          existingArchitecture &&
          typeof existingArchitecture === "object"
        ) {
          // If existingArchitecture object is provided directly (e.g., manually added architecture)
          existingArch = existingArchitecture as ArchitectureBlueprint;
          isIteration = true;
        }

        // Generate architecture using Gemini, passing existing architecture if available
        const result = await generateArchitecture(prompt, existingArch);
        const architecture = result.architecture;

        // Create the full blueprint
        const blueprint: ArchitectureBlueprint = {
          id: existingArch?.id || `arch-${Date.now()}`,
          prompt: isIteration
            ? `${existingArch?.prompt || ""} - Iteration: ${prompt}`
            : prompt,
          services: architecture.services || [],
          connections: architecture.connections || [],
          patterns: architecture.patterns || [],
          scaling_model: architecture.scaling_model || "horizontal",
          summary: architecture.summary || "System architecture generated",
          estimated_cost: estimateCost(architecture),
          created_at: existingArch?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        let savedArchitecture;

        if (isIteration && architectureId) {
          // Update existing architecture
          [savedArchitecture] = await db
            .update(schema.architectures)
            .set({
              prompt: blueprint.prompt,
              services: blueprint.services as any,
              connections: blueprint.connections as any,
              patterns: blueprint.patterns as any,
              scalingModel: blueprint.scaling_model,
              summary: blueprint.summary,
              estimatedCost: blueprint.estimated_cost as any,
              updatedAt: new Date(),
            })
            .where(eq(schema.architectures.id, architectureId))
            .returning();
        } else {
          // Save new architecture to database
          [savedArchitecture] = await db
            .insert(schema.architectures)
            .values({
              userId: user.id,
              prompt: blueprint.prompt,
              services: blueprint.services as any,
              connections: blueprint.connections as any,
              patterns: blueprint.patterns as any,
              scalingModel: blueprint.scaling_model,
              summary: blueprint.summary,
              estimatedCost: blueprint.estimated_cost as any,
            })
            .returning();
        }

        // Track token usage
        await db.insert(schema.tokenUsage).values({
          userId: user.id,
          operation: "architecture_generation",
          inputTokens: result.tokenUsage.inputTokens,
          outputTokens: result.tokenUsage.outputTokens,
          totalTokens: result.tokenUsage.totalTokens,
          architectureId: savedArchitecture.id,
        });

        // Return blueprint with database ID
        return NextResponse.json({
          ...blueprint,
          id: savedArchitecture.id.toString(),
          dbId: savedArchitecture.id,
        });
      } catch (error) {
        console.error("Error in design API:", error);
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Failed to generate architecture" },
          { status: 500 }
        );
      }
    }
  );
}
