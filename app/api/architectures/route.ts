import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { eq, desc } from "drizzle-orm";
import { ArchitectureBlueprint } from "@/lib/types";
import { monitorApiRoute } from "@/lib/monitoring/api-monitoring";
import * as Sentry from "@sentry/nextjs";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return monitorApiRoute(
    { route: "/api/architectures", method: "GET", request },
    async () => {
      try {
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

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Fetch user's architectures (newest first)
        const userArchitectures = await db
          .select()
          .from(schema.architectures)
          .where(eq(schema.architectures.userId, user.id))
          .orderBy(desc(schema.architectures.updatedAt))
          .limit(limit)
          .offset(offset);

        // Convert to ArchitectureBlueprint format
        const blueprints: ArchitectureBlueprint[] = userArchitectures.map(
          (arch) => ({
            id: arch.id.toString(),
            prompt: arch.prompt,
            services: (arch.services as any) || [],
            connections: (arch.connections as any) || [],
            patterns: (arch.patterns as any) || [],
            scaling_model: arch.scalingModel as
              | "horizontal"
              | "vertical"
              | "hybrid",
            summary: arch.summary || "",
            estimated_cost: arch.estimatedCost as any,
            created_at: arch.createdAt.toISOString(),
            updated_at: arch.updatedAt.toISOString(),
          })
        );

        return NextResponse.json({
          ok: true,
          architectures: blueprints,
          count: blueprints.length,
        });
      } catch (error) {
        console.error("Error fetching architectures:", error);
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Failed to fetch architectures" },
          { status: 500 }
        );
      }
    }
  );
}

export async function POST(request: NextRequest) {
  return monitorApiRoute(
    { route: "/api/architectures", method: "POST", request },
    async () => {
      try {
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

        const body = await request.json();
        const {
          architecture,
          architectureId,
        }: {
          architecture: ArchitectureBlueprint;
          architectureId?: number | null;
        } = body;

        if (!architecture) {
          return NextResponse.json(
            { error: "Architecture is required" },
            { status: 400 }
          );
        }

        let savedArchitecture;

        if (architectureId) {
          // Update existing architecture - verify ownership
          const existingArch = await db
            .select()
            .from(schema.architectures)
            .where(eq(schema.architectures.id, architectureId))
            .limit(1);

          if (existingArch.length === 0) {
            return NextResponse.json(
              { error: "Architecture not found" },
              { status: 404 }
            );
          }

          if (existingArch[0].userId !== user.id) {
            return NextResponse.json(
              { error: "Unauthorized" },
              { status: 403 }
            );
          }

          // Update existing architecture
          [savedArchitecture] = await db
            .update(schema.architectures)
            .set({
              prompt: architecture.prompt || existingArch[0].prompt,
              services: architecture.services as any,
              connections: architecture.connections as any,
              patterns: architecture.patterns as any,
              scalingModel: architecture.scaling_model || existingArch[0].scalingModel,
              summary: architecture.summary || existingArch[0].summary,
              estimatedCost: architecture.estimated_cost as any,
              updatedAt: new Date(),
            })
            .where(eq(schema.architectures.id, architectureId))
            .returning();
        } else {
          // Create new architecture
          [savedArchitecture] = await db
            .insert(schema.architectures)
            .values({
              userId: user.id,
              prompt: architecture.prompt || "Manually created architecture",
              services: architecture.services as any,
              connections: architecture.connections as any,
              patterns: architecture.patterns as any,
              scalingModel: architecture.scaling_model || "horizontal",
              summary: architecture.summary || "Manually created architecture diagram",
              estimatedCost: architecture.estimated_cost as any,
            })
            .returning();
        }

        // Convert to ArchitectureBlueprint format
        const blueprint: ArchitectureBlueprint = {
          id: savedArchitecture.id.toString(),
          prompt: savedArchitecture.prompt,
          services: (savedArchitecture.services as any) || [],
          connections: (savedArchitecture.connections as any) || [],
          patterns: (savedArchitecture.patterns as any) || [],
          scaling_model: savedArchitecture.scalingModel as
            | "horizontal"
            | "vertical"
            | "hybrid",
          summary: savedArchitecture.summary || "",
          estimated_cost: savedArchitecture.estimatedCost as any,
          created_at: savedArchitecture.createdAt.toISOString(),
          updated_at: savedArchitecture.updatedAt.toISOString(),
        };

        return NextResponse.json({
          ok: true,
          architecture: blueprint,
          dbId: savedArchitecture.id,
        });
      } catch (error) {
        console.error("Error saving architecture:", error);
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Failed to save architecture" },
          { status: 500 }
        );
      }
    }
  );
}