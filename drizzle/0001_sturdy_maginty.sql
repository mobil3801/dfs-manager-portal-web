ALTER TABLE "employees" ADD COLUMN "gas_station_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "id_documents" jsonb DEFAULT '[]'::jsonb;