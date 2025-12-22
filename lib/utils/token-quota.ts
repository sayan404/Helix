import { db, schema } from "@/lib/db/drizzle";
import { eq, sum } from "drizzle-orm";

export type UserTokenQuota = {
  maxAllowedTokens: number;
  tokensUsed: number;
  tokensLeft: number;
};

export async function getUserTokenQuota(
  userId: number
): Promise<UserTokenQuota> {
  if (!db) {
    return {
      maxAllowedTokens: 0,
      tokensUsed: 0,
      tokensLeft: 0,
    };
  }

  const [userRow] = await db
    .select({
      maxAllowedTokens: schema.users.maxAllowedTokens,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const maxAllowedTokens = Number(userRow?.maxAllowedTokens) || 5000;

  const totals = await db
    .select({
      totalTokens: sum(schema.tokenUsage.totalTokens),
    })
    .from(schema.tokenUsage)
    .where(eq(schema.tokenUsage.userId, userId));

  const tokensUsed = Number(totals[0]?.totalTokens) || 0;
  const tokensLeft = Math.max(maxAllowedTokens - tokensUsed, 0);

  return { maxAllowedTokens, tokensUsed, tokensLeft };
}
