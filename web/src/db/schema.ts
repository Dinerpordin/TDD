import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const localeEnum = pgEnum("locale", ["bn", "en"]);

export const draftStatusEnum = pgEnum("draft_status", [
  "draft",
  "in_review",
  "approved",
  "rejected",
  "published",
]);

export const reviewDecisionEnum = pgEnum("review_decision", [
  "pending",
  "approved",
  "rejected",
  "changes_requested",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  defaultLocale: localeEnum("default_locale").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 255 }).notNull(),
    name: text("name").notNull(),
    cmsConfig: jsonb("cms_config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("sites_tenant_idx").on(t.tenantId),
    uniqueIndex("sites_tenant_domain_uidx").on(t.tenantId, t.domain),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 128 }).notNull(),
    nameEn: text("name_en").notNull(),
    nameBn: text("name_bn").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("categories_site_slug_uidx").on(t.siteId, t.slug),
    index("categories_site_idx").on(t.siteId),
  ],
);

export const storyClusters = pgTable(
  "story_clusters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    fingerprint: varchar("fingerprint", { length: 256 }).notNull(),
    topicTags: text("topic_tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    summaryHint: text("summary_hint"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("story_clusters_tenant_fingerprint_uidx").on(
      t.tenantId,
      t.fingerprint,
    ),
  ],
);

export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    storyClusterId: uuid("story_cluster_id")
      .notNull()
      .references(() => storyClusters.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    status: draftStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
    dek: text("dek"),
    bodyMd: text("body_md").notNull(),
    provenanceJson: jsonb("provenance_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    riskScore: integer("risk_score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("drafts_tenant_status_idx").on(t.tenantId, t.status),
    index("drafts_cluster_locale_idx").on(t.storyClusterId, t.locale),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    decision: reviewDecisionEnum("decision").notNull().default("pending"),
    notes: text("notes"),
    reviewerEmail: varchar("reviewer_email", { length: 255 }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("reviews_draft_idx").on(t.draftId)],
);

export const routeRules = pgTable(
  "route_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    priority: integer("priority").notNull().default(100),
    matchJson: jsonb("match_json")
      .$type<{
        tagsAny?: string[];
        locale?: "bn" | "en";
        topicIncludes?: string[];
      }>()
      .notNull(),
    targetSiteId: uuid("target_site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    targetCategoryId: uuid("target_category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("route_rules_tenant_priority_idx").on(t.tenantId, t.priority)],
);

export const publications = pgTable(
  "publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    draftId: uuid("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    canonicalUrl: text("canonical_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("publications_draft_idx").on(t.draftId)],
);

export const pipelineJobs = pgTable(
  "pipeline_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    runAfter: timestamp("run_after", { withTimezone: true }).defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("pipeline_jobs_status_run_idx").on(t.status, t.runAfter)],
);
