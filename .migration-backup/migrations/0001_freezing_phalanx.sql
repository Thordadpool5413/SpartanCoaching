CREATE TABLE "agreement_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" varchar NOT NULL,
	"document_types" text[] NOT NULL,
	"token" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "agreement_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "assessment_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"token" varchar NOT NULL,
	"candidate_email" text NOT NULL,
	"candidate_name" varchar NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	CONSTRAINT "assessment_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"text" text NOT NULL,
	"options" text[],
	"correct_answer" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"candidate_name" varchar NOT NULL,
	"candidate_email" text NOT NULL,
	"answers" jsonb NOT NULL,
	"quiz_score" integer,
	"ai_score" integer,
	"overall_score" integer,
	"ai_feedback" text,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "case_studies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"client_label" text NOT NULL,
	"challenge" text NOT NULL,
	"solution" text NOT NULL,
	"results" text[] NOT NULL,
	"category" text DEFAULT 'individual' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drill_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"drill_index" integer NOT NULL,
	"drill_title" text NOT NULL,
	"notes" text,
	"completed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"event_name" text NOT NULL,
	"metadata" text,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"episode_number" integer,
	"audio_url" varchar,
	"publish_date" timestamp DEFAULT now() NOT NULL,
	"duration" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resource_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" text NOT NULL,
	"resource_id" integer NOT NULL,
	"resource_title" varchar NOT NULL,
	"captured_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"file_url" varchar NOT NULL,
	"category" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roleplay_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roleplay_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"scenario_title" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"feedback" text,
	"rating" integer,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signed_agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"agreement_type" varchar NOT NULL,
	"signer_name" varchar NOT NULL,
	"signer_title" varchar NOT NULL,
	"signer_organization" varchar NOT NULL,
	"signer_email" text NOT NULL,
	"signature_image" text,
	"pdf_data" text,
	"request_id" integer,
	"signed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"quote" text NOT NULL,
	"outcome" text NOT NULL,
	"category" text DEFAULT 'individual' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" text NOT NULL,
	"tool_name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");