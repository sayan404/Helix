import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db, schema } from "@/lib/db/drizzle";
import { and, eq, asc } from "drizzle-orm";

export const dynamic = 'force-dynamic';

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

    const { searchParams } = new URL(request.url);
    const architectureIdRaw = searchParams.get("architectureId");
    const architectureId = architectureIdRaw ? parseInt(architectureIdRaw) : NaN;

    if (!architectureIdRaw || Number.isNaN(architectureId)) {
      return NextResponse.json(
        { error: "architectureId is required" },
        { status: 400 }
      );
    }

    // Ensure architecture belongs to user
    const arch = await db
      .select({ id: schema.architectures.id })
      .from(schema.architectures)
      .where(and(eq(schema.architectures.id, architectureId), eq(schema.architectures.userId, user.id)))
      .limit(1);

    if (!arch.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        serviceName: schema.codeTemplates.serviceName,
        files: schema.codeTemplates.files,
      })
      .from(schema.codeTemplates)
      .where(
        and(
          eq(schema.codeTemplates.architectureId, architectureId),
          eq(schema.codeTemplates.userId, user.id)
        )
      )
      .orderBy(asc(schema.codeTemplates.serviceName));

    return NextResponse.json({
      ok: true,
      codeTemplates: rows.map((r) => ({
        service_name: r.serviceName,
        files: (r.files as any) || {},
      })),
    });
  } catch (error) {
    console.error("Error fetching code templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch code templates" },
      { status: 500 }
    );
  }
}


