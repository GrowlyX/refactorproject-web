ALTER TABLE "projects" ADD COLUMN "language" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "stars" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "forks" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "description" text;