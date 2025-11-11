import {
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const earlyAccessRequests = pgTable(
  "early_access_requests",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    source: varchar("source", { length: 64 }).default("early-access"),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("early_access_requests_email_idx").on(table.email),
  })
);

export type EarlyAccessRequest = typeof earlyAccessRequests.$inferSelect;
export type NewEarlyAccessRequest = typeof earlyAccessRequests.$inferInsert;


