CREATE TABLE "contact_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid,
	"vin" varchar(17) NOT NULL,
	"preferred_contact" varchar(16) NOT NULL,
	"contact_value" varchar(128) NOT NULL,
	"description" varchar(1000),
	"locale" varchar(5) NOT NULL,
	"page_path" varchar(2048) NOT NULL,
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_session_id_tracking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_requests_session_id_idx" ON "contact_requests" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "contact_requests_created_at_idx" ON "contact_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_requests_status_created_at_idx" ON "contact_requests" USING btree ("status","created_at" DESC NULLS LAST);