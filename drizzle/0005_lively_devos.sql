ALTER TABLE "leads" ADD COLUMN "request_number" bigserial NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_request_number_unique" UNIQUE("request_number");