CREATE TYPE "public"."organization_status" AS ENUM('active', 'suspended', 'inactive');--> statement-breakpoint
CREATE TABLE "github_sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"sync_type" varchar(50) NOT NULL,
	"event_type" varchar(100),
	"status" varchar(20) NOT NULL,
	"details" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_org_id" bigint NOT NULL,
	"org_name" varchar(255) NOT NULL,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_installations_github_org_id_unique" UNIQUE("github_org_id")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "github_membership_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN "last_sync_at" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "status" "organization_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "github_app_installed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "last_sync_at" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repository_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repository_url" varchar(500);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "default_branch" varchar(255) DEFAULT 'main';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_private" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "last_analyzed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_id" bigint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_username" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_email" varchar(255);--> statement-breakpoint
ALTER TABLE "github_sync_logs" ADD CONSTRAINT "github_sync_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_sync_logs_organization_id_idx" ON "github_sync_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "github_sync_logs_sync_type_idx" ON "github_sync_logs" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "github_sync_logs_status_idx" ON "github_sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "github_sync_logs_created_at_idx" ON "github_sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pending_installations_github_org_id_idx" ON "pending_installations" USING btree ("github_org_id");--> statement-breakpoint
CREATE INDEX "pending_installations_processed_at_idx" ON "pending_installations" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "organization_members_github_active_idx" ON "organization_members" USING btree ("github_membership_active");--> statement-breakpoint
CREATE INDEX "organizations_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_repository_name_idx" ON "projects" USING btree ("repository_name");--> statement-breakpoint
CREATE INDEX "projects_last_analyzed_idx" ON "projects" USING btree ("last_analyzed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_id_idx" ON "users" USING btree ("github_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_username_idx" ON "users" USING btree ("github_username");--> statement-breakpoint
CREATE INDEX "users_github_email_idx" ON "users" USING btree ("github_email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_github_id_unique" UNIQUE("github_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_github_username_unique" UNIQUE("github_username");