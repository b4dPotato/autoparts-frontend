CREATE TABLE "feature_flags" (
	"name" varchar(64) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "feature_flags" ("name", "enabled")
VALUES ('leadEmailNotifications', false)
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "email_status" SET DEFAULT 'disabled';
