CREATE TABLE "tracking_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_ms" bigint DEFAULT 0 NOT NULL,
	"active_duration_ms" bigint DEFAULT 0 NOT NULL,
	"ip" varchar(64),
	"user_agent" varchar(512),
	"accept_language" varchar(256),
	"landing_page" varchar(2048) NOT NULL,
	"referrer" varchar(2048),
	"gclid" varchar(255),
	"gbraid" varchar(255),
	"wbraid" varchar(255),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(512),
	"utm_term" varchar(512),
	"utm_content" varchar(512),
	"page_views" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"converted" boolean DEFAULT false NOT NULL,
	"conversion_type" varchar(64),
	"bot_status" varchar(32),
	"bot_score" real,
	"bot_reasons" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"type" varchar(64) NOT NULL,
	"path" varchar(2048) NOT NULL,
	"target_type" varchar(64),
	"target_text" varchar(256),
	"target_href" varchar(2048),
	"target_id" varchar(128),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_visitors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sessions_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_sessions" ADD CONSTRAINT "tracking_sessions_visitor_id_tracking_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."tracking_visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_session_id_tracking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracking_sessions_visitor_id_idx" ON "tracking_sessions" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "tracking_sessions_created_at_idx" ON "tracking_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tracking_sessions_last_activity_at_idx" ON "tracking_sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "tracking_sessions_ip_idx" ON "tracking_sessions" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "tracking_sessions_gclid_idx" ON "tracking_sessions" USING btree ("gclid");--> statement-breakpoint
CREATE INDEX "tracking_events_session_id_idx" ON "tracking_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "tracking_events_created_at_idx" ON "tracking_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tracking_events_type_idx" ON "tracking_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "tracking_visitors_created_at_idx" ON "tracking_visitors" USING btree ("created_at");