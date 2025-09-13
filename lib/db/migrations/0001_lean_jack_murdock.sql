CREATE TYPE "public"."workflow_state" AS ENUM('scheduling', 'in_progress', 'complete');--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"state" "workflow_state" DEFAULT 'scheduling' NOT NULL,
	"results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflows_project_id_idx" ON "workflows" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "workflows_state_idx" ON "workflows" USING btree ("state");--> statement-breakpoint
CREATE INDEX "workflows_created_at_idx" ON "workflows" USING btree ("created_at");