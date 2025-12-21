CREATE TABLE "code_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"architecture_id" integer NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"files" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "code_templates" ADD CONSTRAINT "code_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_templates" ADD CONSTRAINT "code_templates_architecture_id_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_templates_architecture_id_idx" ON "code_templates" USING btree ("architecture_id");--> statement-breakpoint
CREATE INDEX "code_templates_user_id_idx" ON "code_templates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "code_templates_architecture_service_uq" ON "code_templates" USING btree ("architecture_id","service_name");


