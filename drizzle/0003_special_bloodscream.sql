ALTER TABLE "contact_requests" RENAME TO "leads";--> statement-breakpoint
ALTER TABLE "leads" RENAME COLUMN "preferred_contact" TO "contact_method";--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT "contact_requests_session_id_tracking_sessions_id_fk";
--> statement-breakpoint
DROP INDEX "contact_requests_session_id_idx";--> statement-breakpoint
DROP INDEX "contact_requests_created_at_idx";--> statement-breakpoint
DROP INDEX "contact_requests_status_created_at_idx";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "visitor_id" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "attribution_source" varchar(32) DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "gclid" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "gbraid" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "wbraid" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "email_status" varchar(32) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "email_provider_message_id" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "email_error" varchar(512);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "email_attempted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_visitor_id_tracking_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."tracking_visitors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_session_id_tracking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_visitor_id_idx" ON "leads" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "leads_session_id_idx" ON "leads" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_status_created_at_idx" ON "leads" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_email_status_created_at_idx" ON "leads" USING btree ("email_status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_gclid_idx" ON "leads" USING btree ("gclid");