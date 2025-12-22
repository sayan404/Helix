import { NextResponse } from "next/server";


export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const providedPasscode =
    typeof body?.passcode === "string" ? body.passcode.trim() : "";

  const expectedPasscode = process.env.EARLY_ACCESS_PASSCODE?.trim();

  if (!providedPasscode) {
    return NextResponse.json(
      { error: "No passcode received." },
      { status: 400 }
    );
  }

  if (providedPasscode !== expectedPasscode) {
    return NextResponse.json(
      {
        error:
          "That passcode doesn't match. Check with your Helix contact and try again.",
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: process.env.ACCESS_COOKIE_NAME || "",
    value: process.env.ACCESS_COOKIE_VALUE || "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
