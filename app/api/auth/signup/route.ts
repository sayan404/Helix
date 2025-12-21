import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/drizzle";
import { hashPassword, generateToken } from "@/lib/auth/utils";

const signupSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  name: z.string().min(1, "Name is required.").max(255).optional(),
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

  try {
    const json = await request.json().catch(() => null);
    
    if (!json) {
      return NextResponse.json(
        {
          error: "Invalid request. Please provide all required fields.",
        },
        { status: 400 }
      );
    }
    
    const parsed = signupSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid payload received.",
        },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email: normalizedEmail,
        passwordHash,
        name: name?.trim() || null,
      })
      .returning();

    // Generate token
    const token = generateToken(newUser.id, newUser.email);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set({
      name: "auth-token",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        error: "Failed to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}
