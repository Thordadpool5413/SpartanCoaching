CREATE TABLE "assessment_clients" (
        "id" serial PRIMARY KEY NOT NULL,
        "slug" varchar(100) NOT NULL,
        "company_name" varchar NOT NULL,
        "logo_url" text,
        "accent_color" varchar(20),
        "assessment_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "assessment_clients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD COLUMN IF NOT EXISTS "client_slug" varchar(100);