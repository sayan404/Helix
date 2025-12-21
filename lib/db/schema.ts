import {
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
  text,
  jsonb,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

// Token usage operation types
export const tokenUsageOperationEnum = pgEnum("token_usage_operation", [
  "architecture_generation",
  "code_generation",
  "architecture_evaluation",
]);

// Architectures table
export const architectures = pgTable(
  "architectures",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    services: jsonb("services").notNull(),
    connections: jsonb("connections").notNull(),
    patterns: jsonb("patterns").notNull(),
    scalingModel: varchar("scaling_model", { length: 50 }).notNull(),
    summary: text("summary"),
    estimatedCost: jsonb("estimated_cost"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("architectures_user_id_idx").on(table.userId),
    createdAtIdx: index("architectures_created_at_idx").on(table.createdAt),
  })
);

// Token usage table
export const tokenUsage = pgTable(
  "token_usage",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    operation: tokenUsageOperationEnum("operation").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    architectureId: integer("architecture_id").references(() => architectures.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("token_usage_user_id_idx").on(table.userId),
    architectureIdIdx: index("token_usage_architecture_id_idx").on(
      table.architectureId
    ),
    createdAtIdx: index("token_usage_created_at_idx").on(table.createdAt),
  })
);

// Generated code templates (persisted boilerplate per architecture/service)
export const codeTemplates = pgTable(
  "code_templates",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    architectureId: integer("architecture_id")
      .notNull()
      .references(() => architectures.id, { onDelete: "cascade" }),
    serviceName: varchar("service_name", { length: 255 }).notNull(),
    files: jsonb("files").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    archIdx: index("code_templates_architecture_id_idx").on(table.architectureId),
    userIdx: index("code_templates_user_id_idx").on(table.userId),
    archServiceUq: uniqueIndex("code_templates_architecture_service_uq").on(
      table.architectureId,
      table.serviceName
    ),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  architectures: many(architectures),
  tokenUsage: many(tokenUsage),
  codeTemplates: many(codeTemplates),
}));

export const architecturesRelations = relations(architectures, ({ one, many }) => ({
  user: one(users, {
    fields: [architectures.userId],
    references: [users.id],
  }),
  tokenUsage: many(tokenUsage),
  codeTemplates: many(codeTemplates),
}));

export const codeTemplatesRelations = relations(codeTemplates, ({ one }) => ({
  user: one(users, {
    fields: [codeTemplates.userId],
    references: [users.id],
  }),
  architecture: one(architectures, {
    fields: [codeTemplates.architectureId],
    references: [architectures.id],
  }),
}));

export type EarlyAccessRequest = typeof earlyAccessRequests.$inferSelect;
export type NewEarlyAccessRequest = typeof earlyAccessRequests.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Architecture = typeof architectures.$inferSelect;
export type NewArchitecture = typeof architectures.$inferInsert;
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type NewTokenUsage = typeof tokenUsage.$inferInsert;
export type CodeTemplateRow = typeof codeTemplates.$inferSelect;
export type NewCodeTemplateRow = typeof codeTemplates.$inferInsert;
