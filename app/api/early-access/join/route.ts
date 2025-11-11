import { NextResponse } from "next/server";
import { z } from "zod";

import { db, schema } from "@/lib/db/drizzle";

const payloadSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  source: z.string().min(1).max(64).optional(),
});

export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json(
      {
        error:
          "Database connection unavailable. Please configure DATABASE_URL for Neon.",
      },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid payload received.",
      },
      { status: 400 }
    );
  }

  const { email, source } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const inserted = await db
      .insert(schema.earlyAccessRequests)
      .values({
        email: normalizedEmail,
        source: source ?? "early-access",
      })
      .onConflictDoNothing({
        target: schema.earlyAccessRequests.email,
      })
      .returning();

    const alreadyRegistered = inserted.length === 0;

    return NextResponse.json({
      ok: true,
      alreadyRegistered,
    });
  } catch (error) {
    console.error("Failed to insert early access request", error);
    return NextResponse.json(
      {
        error: "We couldn't save your request. Please try again in a bit.",
      },
      { status: 500 }
    );
  }
}
