CREATE TABLE "gallery_items" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"type" varchar(16) DEFAULT 'image' NOT NULL,
	"title" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "gallery_items_type_idx" ON "gallery_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gallery_items_sort_idx" ON "gallery_items" USING btree ("sort_order");