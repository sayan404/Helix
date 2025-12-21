import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/drizzle";
import { verifyToken } from "./utils";

export async function getCurrentUser() {
  if (!db) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return null;
    }

    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, decoded.userId))
      .limit(1);

    return user || null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

