import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/drizzle";
import { verifyPassword, generateToken } from "@/lib/auth/utils";

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
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
          error: "Invalid request. Please provide email and password.",
        },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid payload received.",
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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

    // Log for debugging (remove in production)
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[Login] Token generated and cookie set for user:",
        user.email
      );
      console.log("[Login] Token preview:", token.substring(0, 20) + "...");
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Failed to login. Please try again.",
      },
      { status: 500 }
    );
  }
}
