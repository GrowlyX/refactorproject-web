CREATE TYPE "public"."organization_status" AS ENUM('active', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."workflow_state" AS ENUM('scheduling', 'in_progress', 'complete');--> statement-breakpoint
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
CREATE TABLE "organization_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"github_membership_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"github_app_installed" boolean DEFAULT false NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_github_id_unique" UNIQUE("github_id")
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
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"github_repository_id" bigint NOT NULL,
	"repository_name" varchar(255) NOT NULL,
	"repository_url" varchar(500),
	"default_branch" varchar(255) DEFAULT 'main',
	"is_private" boolean DEFAULT true NOT NULL,
	"last_analyzed_at" timestamp,
	"module_interlinks" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_github_repository_id_unique" UNIQUE("github_repository_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"authkit_id" varchar(255) NOT NULL,
	"github_id" bigint,
	"github_username" varchar(255),
	"github_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_authkit_id_unique" UNIQUE("authkit_id")
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"state" "workflow_state" DEFAULT 'scheduling' NOT NULL,
	"results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_sync_logs" ADD CONSTRAINT "github_sync_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_sync_logs_organization_id_idx" ON "github_sync_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "github_sync_logs_sync_type_idx" ON "github_sync_logs" USING btree ("sync_type");--> statement-breakpoint
CREATE INDEX "github_sync_logs_status_idx" ON "github_sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "github_sync_logs_created_at_idx" ON "github_sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_members_github_active_idx" ON "organization_members" USING btree ("github_membership_active");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_unique_idx" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_github_id_idx" ON "organizations" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "organizations_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organizations_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "pending_installations_github_org_id_idx" ON "pending_installations" USING btree ("github_org_id");--> statement-breakpoint
CREATE INDEX "pending_installations_processed_at_idx" ON "pending_installations" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "projects_organization_id_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_github_repository_id_idx" ON "projects" USING btree ("github_repository_id");--> statement-breakpoint
CREATE INDEX "projects_repository_name_idx" ON "projects" USING btree ("repository_name");--> statement-breakpoint
CREATE INDEX "projects_last_analyzed_idx" ON "projects" USING btree ("last_analyzed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_authkit_id_idx" ON "users" USING btree ("authkit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_id_idx" ON "users" USING btree ("github_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_username_idx" ON "users" USING btree ("github_username");--> statement-breakpoint
CREATE INDEX "users_github_email_idx" ON "users" USING btree ("github_email");--> statement-breakpoint
CREATE INDEX "workflows_project_id_idx" ON "workflows" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "workflows_state_idx" ON "workflows" USING btree ("state");--> statement-breakpoint
CREATE INDEX "workflows_created_at_idx" ON "workflows" USING btree ("created_at");