import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Convert JWT_SECRET to Uint8Array for jose (Edge Runtime compatible)
function getJwtSecretKey(): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(
  token: string
): { userId: number; email: string } | null {
  try {
    if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production") {
      console.warn(
        "[Auth] JWT_SECRET is using default value. Set a proper secret in production!"
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
    };
    return decoded;
  } catch (error) {
    // Log error for debugging (remove in production)
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[Auth] Token verification failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
    return null;
  }
}

/**
 * Verify token in Edge Runtime (for middleware)
 * Uses jose library which is compatible with Edge Runtime
 */
export async function verifyTokenEdge(
  token: string
): Promise<{ userId: number; email: string } | null> {
  try {
    if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production") {
      console.warn(
        "[Auth] JWT_SECRET is using default value. Set a proper secret in production!"
      );
    }

    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey);

    return {
      userId: payload.userId as number,
      email: payload.email as string,
    };
  } catch (error) {
    // Log error for debugging (remove in production)
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[Auth] Token verification failed (Edge):",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}
