import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { eq, sum } from "drizzle-orm";
import { getUserTokenQuota } from "@/lib/utils/token-quota";

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
    const limit = parseInt(searchParams.get("limit") || "100");

    // Fetch user's token usage
    const usageRecords = await db
      .select()
      .from(schema.tokenUsage)
      .where(eq(schema.tokenUsage.userId, user.id))
      .orderBy(schema.tokenUsage.createdAt)
      .limit(limit);

    // Calculate totals
    const totals = await db
      .select({
        totalInputTokens: sum(schema.tokenUsage.inputTokens),
        totalOutputTokens: sum(schema.tokenUsage.outputTokens),
        totalTokens: sum(schema.tokenUsage.totalTokens),
      })
      .from(schema.tokenUsage)
      .where(eq(schema.tokenUsage.userId, user.id));

    const total = totals[0] || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
    };

    const quota = await getUserTokenQuota(user.id);

    return NextResponse.json({
      ok: true,
      usage: usageRecords.map((record) => ({
        id: record.id,
        operation: record.operation,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        architectureId: record.architectureId,
        createdAt: record.createdAt.toISOString(),
      })),
      totals: {
        inputTokens: Number(total.totalInputTokens) || 0,
        outputTokens: Number(total.totalOutputTokens) || 0,
        totalTokens: Number(total.totalTokens) || 0,
      },
      quota,
    });
  } catch (error) {
    console.error("Error fetching token usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch token usage" },
      { status: 500 }
    );
  }
}
