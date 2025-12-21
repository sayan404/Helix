CREATE TYPE "public"."token_usage_operation" AS ENUM('architecture_generation', 'code_generation', 'architecture_evaluation');--> statement-breakpoint
CREATE TABLE "architectures" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"services" jsonb NOT NULL,
	"connections" jsonb NOT NULL,
	"patterns" jsonb NOT NULL,
	"scaling_model" varchar(50) NOT NULL,
	"summary" text,
	"estimated_cost" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"operation" "token_usage_operation" NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"architecture_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "architectures" ADD CONSTRAINT "architectures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_architecture_id_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "architectures_user_id_idx" ON "architectures" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "architectures_created_at_idx" ON "architectures" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "token_usage_user_id_idx" ON "token_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "token_usage_architecture_id_idx" ON "token_usage" USING btree ("architecture_id");--> statement-breakpoint
CREATE INDEX "token_usage_created_at_idx" ON "token_usage" USING btree ("created_at");