/**
 * Universal search API (HSP-36 Slice A).
 *
 * GET /api/v1/search?q=&limit=
 * Permission-aware multi-type retrieval with shared ranking contract.
 */
import type { Express } from "express";
import { and, desc, eq, ne } from "drizzle-orm";
import { providerResources, resourceWork } from "@workspace/db";
import {
  FIELD_KIT_TOOLS,
  DISCOVERY_INTENT_SPECS,
} from "@workspace/field-kit-catalog";
import { db } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { lightAiLimit } from "../rateLimits";
import { storage } from "../storage";
import {
  searchSpartanKnowledge,
  SPARTAN_CORPUS,
} from "../knowledge/spartanCorpus";
import {
  documentsFromIntents,
  documentsFromTools,
  runUniversalSearch,
  sanitizeSearchText,
  type SearchDocument,
  type SearchPermissions,
} from "../search/universalSearch";

function permsFromRequest(req: AuthedRequest): SearchPermissions {
  const member = req.fieldKit?.member;
  return {
    authenticated: Boolean(req.clientMemberId && member),
    canUseFieldKit: Boolean(req.fieldKit?.allowed),
    organizationId: member?.organizationId,
    memberId: member?.id ?? req.clientMemberId,
    role: member?.role,
  };
}

async function loadSearchDocuments(
  perms: SearchPermissions,
): Promise<SearchDocument[]> {
  const docs: SearchDocument[] = [];

  // Catalog tools + discovery intents (global, gated)
  docs.push(...documentsFromTools(FIELD_KIT_TOOLS));
  docs.push(
    ...documentsFromIntents(
      DISCOVERY_INTENT_SPECS.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        destinations: i.destinations
          .map((d) => {
            if ("webPath" in d && d.webPath) return { webPath: d.webPath };
            if ("toolId" in d) {
              const tool = FIELD_KIT_TOOLS.find((t) => t.id === d.toolId);
              return tool ? { webPath: tool.path } : {};
            }
            return {};
          })
          .filter((d) => d.webPath),
      })),
    ),
  );

  // Public CMS content (articles, resources, podcasts) — no PHI in CMS titles
  try {
    const articles = await storage.getArticles();
    for (const a of articles || []) {
      docs.push({
        id: `article:${a.id}`,
        type: "article",
        title: String(a.title || "Article"),
        snippet: sanitizeSearchText(String(a.description || a.title || ""), 160),
        href: `/articles`,
        mobileHref: "/(tabs)/learn",
        tags: ["article", String((a as { category?: string }).category || "")],
        keywords: [String((a as { category?: string }).category || "")],
      });
    }
  } catch {
    // DB optional in some environments
  }

  try {
    const resources = await storage.getAllResources();
    for (const r of resources || []) {
      const lifecycle = (r as { lifecycleStatus?: string }).lifecycleStatus;
      const unavailable =
        lifecycle === "retired" || lifecycle === "archived" || lifecycle === "deleted";
      docs.push({
        id: `resource:${r.id}`,
        type: "resource",
        title: String(r.title || "Resource"),
        snippet: sanitizeSearchText(String(r.description || r.title || ""), 160),
        href: String(r.fileUrl || "/resources").startsWith("/resources/")
          ? String(r.fileUrl)
          : "/resources",
        mobileHref: "/(tabs)/learn",
        tags: ["resource", String(r.category || "")],
        unavailable,
      });
    }
  } catch {
    // ignore
  }

  try {
    const podcasts = await storage.getAllPodcasts();
    for (const p of podcasts || []) {
      docs.push({
        id: `podcast:${p.id}`,
        type: "podcast",
        title: String(p.title || "Podcast"),
        snippet: sanitizeSearchText(String(p.description || p.title || ""), 160),
        href: "/podcasts",
        mobileHref: "/(tabs)/learn",
        tags: ["podcast"],
      });
    }
  } catch {
    // ignore
  }

  // Methodology knowledge (Field Kit)
  if (perms.canUseFieldKit) {
    for (const k of SPARTAN_CORPUS) {
      docs.push({
        id: `knowledge:${k.id}`,
        type: "knowledge",
        title: k.title,
        snippet: sanitizeSearchText(k.body, 160),
        href: "/portal/learn",
        mobileHref: "/(tabs)/learn",
        tags: [k.category, ...k.tags],
        keywords: k.tags,
        requiresFieldKit: true,
        requiresAuth: true,
      });
    }
  }

  // Tenant saved work
  if (perms.canUseFieldKit && perms.memberId && perms.organizationId) {
    try {
      const rows = await db
        .select()
        .from(resourceWork)
        .where(
          and(
            eq(resourceWork.organizationId, perms.organizationId),
            eq(resourceWork.memberId, perms.memberId),
          ),
        )
        .orderBy(desc(resourceWork.updatedAt))
        .limit(50);
      for (const row of rows) {
        docs.push({
          id: `saved_work:${row.id}`,
          type: "saved_work",
          title: String(row.title || row.resourceKey || "Saved work"),
          snippet: sanitizeSearchText(
            `Saved ${row.status} · ${row.resourceKey}`,
            160,
          ),
          href: "/resources/weekly-plan",
          mobileHref: "/resource-work",
          tags: ["saved", row.resourceKey, row.status],
          organizationId: row.organizationId,
          memberId: row.memberId,
          requiresFieldKit: true,
          requiresAuth: true,
        });
      }
    } catch {
      // ignore
    }

    try {
      const prow = await db
        .select()
        .from(providerResources)
        .where(
          and(
            eq(providerResources.organizationId, perms.organizationId),
            ne(providerResources.status, "deleted"),
          ),
        )
        .limit(80);
      for (const row of prow) {
        const archived = row.status === "archived" || row.status === "draft";
        docs.push({
          id: `provider_resource:${row.id}`,
          type: "provider_resource",
          title: String(row.title || "Provider resource"),
          snippet: sanitizeSearchText(String(row.description || row.kind || ""), 160),
          href: "/resources",
          mobileHref: "/(tabs)/learn",
          tags: ["provider", String(row.kind || ""), String(row.status || "")],
          organizationId: row.organizationId,
          requiresFieldKit: true,
          requiresAuth: true,
          unavailable: archived && row.status !== "published",
          deleted: row.status === "deleted",
        });
      }
    } catch {
      // ignore
    }
  }

  return docs;
}

export function registerUniversalSearchRoutes(app: Express): void {
  /**
   * Authenticated universal search. Field Kit gates tools/knowledge/saved work;
   * CMS content remains visible to any signed-in member.
   */
  app.get(
    "/api/v1/search",
    requireAuth,
    lightAiLimit,
    async (req: AuthedRequest, res) => {
      try {
        const q = String(req.query.q || "").trim();
        if (q.length < 2) {
          return res.status(400).json({
            error: "Query q must be at least 2 characters",
            code: "QUERY_TOO_SHORT",
          });
        }
        const limit = Math.min(parseInt(String(req.query.limit || "24"), 10) || 24, 40);
        const perms = permsFromRequest(req);
        const documents = await loadSearchDocuments(perms);

        // Knowledge recall: also score full corpus against query (not only seed)
        if (perms.canUseFieldKit) {
          const knowledgeHits = searchSpartanKnowledge(q, 8);
          for (const k of knowledgeHits) {
            const id = `knowledge:${k.id}`;
            if (!documents.some((d) => d.id === id)) {
              documents.push({
                id,
                type: "knowledge",
                title: k.title,
                snippet: sanitizeSearchText(k.body, 160),
                href: "/portal/learn",
                mobileHref: "/(tabs)/learn",
                tags: [k.category, ...k.tags],
                keywords: k.tags,
                requiresFieldKit: true,
                requiresAuth: true,
              });
            }
          }
        }

        const result = runUniversalSearch(documents, q, perms, { limit, perGroup: 6 });
        res.json(result);
      } catch (error: unknown) {
        console.error("Universal search error:", error);
        res.status(500).json({ error: "Search failed", code: "SEARCH_FAILED" });
      }
    },
  );
}
