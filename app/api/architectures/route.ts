import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { eq, desc } from "drizzle-orm";
import { ArchitectureBlueprint } from "@/lib/types";

export async function GET(request: NextRequest) {
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
    return NextResponse.json(
      { error: "Failed to fetch architectures" },
      { status: 500 }
    );
  }
}
