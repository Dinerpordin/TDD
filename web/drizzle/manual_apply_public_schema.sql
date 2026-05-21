-- Manual one-shot apply for Supabase SQL Editor (TDD project ref cwsycyrrhbxoddvghkah).
-- Prefer: `cd web && DATABASE_URL='postgresql://...?sslmode=require' npm run db:migrate`
-- Use this file only when the CLI cannot reach Postgres.
--
-- After this script, run `manual_stamp_drizzle_journal.sql`, then `npm run db:seed` locally.

CREATE TYPE "public"."draft_status" AS ENUM('draft', 'in_review', 'approved', 'rejected', 'published');
CREATE TYPE "public"."job_status" AS ENUM('pending', 'processing', 'completed', 'failed');
CREATE TYPE "public"."locale" AS ENUM('bn', 'en');
CREATE TYPE "public"."review_decision" AS ENUM('pending', 'approved', 'rejected', 'changes_requested');
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name_en" text NOT NULL,
	"name_bn" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"story_cluster_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"status" "draft_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"dek" text,
	"body_md" text NOT NULL,
	"provenance_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pipeline_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"run_after" timestamp with time zone DEFAULT now(),
	"locked_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"canonical_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"decision" "review_decision" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"reviewer_email" varchar(255),
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "route_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"match_json" jsonb NOT NULL,
	"target_site_id" uuid NOT NULL,
	"target_category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"cms_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "story_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fingerprint" varchar(256) NOT NULL,
	"topic_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_hint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(128) NOT NULL,
	"default_locale" "locale" DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);

ALTER TABLE "categories" ADD CONSTRAINT "categories_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_story_cluster_id_story_clusters_id_fk" FOREIGN KEY ("story_cluster_id") REFERENCES "public"."story_clusters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "publications" ADD CONSTRAINT "publications_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "publications" ADD CONSTRAINT "publications_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "publications" ADD CONSTRAINT "publications_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "route_rules" ADD CONSTRAINT "route_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "route_rules" ADD CONSTRAINT "route_rules_target_site_id_sites_id_fk" FOREIGN KEY ("target_site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "route_rules" ADD CONSTRAINT "route_rules_target_category_id_categories_id_fk" FOREIGN KEY ("target_category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sites" ADD CONSTRAINT "sites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "story_clusters" ADD CONSTRAINT "story_clusters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "categories_site_slug_uidx" ON "categories" USING btree ("site_id","slug");
CREATE INDEX "categories_site_idx" ON "categories" USING btree ("site_id");
CREATE INDEX "drafts_tenant_status_idx" ON "drafts" USING btree ("tenant_id","status");
CREATE INDEX "drafts_cluster_locale_idx" ON "drafts" USING btree ("story_cluster_id","locale");
CREATE INDEX "pipeline_jobs_status_run_idx" ON "pipeline_jobs" USING btree ("status","run_after");
CREATE INDEX "publications_draft_idx" ON "publications" USING btree ("draft_id");
CREATE INDEX "reviews_draft_idx" ON "reviews" USING btree ("draft_id");
CREATE INDEX "route_rules_tenant_priority_idx" ON "route_rules" USING btree ("tenant_id","priority");
CREATE INDEX "sites_tenant_idx" ON "sites" USING btree ("tenant_id");
CREATE UNIQUE INDEX "sites_tenant_domain_uidx" ON "sites" USING btree ("tenant_id","domain");
CREATE UNIQUE INDEX "story_clusters_tenant_fingerprint_uidx" ON "story_clusters" USING btree ("tenant_id","fingerprint");