CREATE INDEX "tracking_sessions_started_at_id_idx" ON "tracking_sessions" USING btree ("started_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "tracking_sessions_visitor_started_at_idx" ON "tracking_sessions" USING btree ("visitor_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "tracking_sessions_ip_started_at_idx" ON "tracking_sessions" USING btree ("ip","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "tracking_events_session_created_at_idx" ON "tracking_events" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "tracking_events_type_created_at_idx" ON "tracking_events" USING btree ("type","created_at");