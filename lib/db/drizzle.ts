import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var __drizzle__: ReturnType<typeof drizzle> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "DATABASE_URL is not set. The Neon database will not be initialized."
  );
}

const sql = connectionString ? neon(connectionString) : undefined;

export const db =
  (() => {
    if (!sql) return undefined;

    // In development, reuse the same Drizzle instance to avoid exhausting connections
    if (process.env.NODE_ENV !== "production") {
      if (!global.__drizzle__) {
        global.__drizzle__ = drizzle(sql, { schema });
      }

      return global.__drizzle__;
    }

    return drizzle(sql, { schema });
  })() ?? null;

export type DbClient = NonNullable<typeof db>;
export { schema };
