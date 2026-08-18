import type { Express } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  emptyPersonalizationPayload,
  memberPersonalization,
  type PersonalizationPayload,
} from "@workspace/db";
import { db } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { normalizePayload } from "../personalization/personalizationEngine";

const bodySchema = z.object({
  state: z.string().trim().min(2).max(80).nullable(),
  macRegion: z.string().trim().min(2).max(120).nullable(),
}).strict();

async function loadPayload(memberId: number): Promise<{ id: number | null; organizationId: number; payload: PersonalizationPayload }> {
  const [member] = await db.query.clientMembers.findMany({
    where: (table, { eq: equals }) => equals(table.id, memberId),
    limit: 1,
  });
  if (!member) throw new Error("Member not found");

  const [row] = await db
    .select()
    .from(memberPersonalization)
    .where(eq(memberPersonalization.memberId, memberId))
    .limit(1);

  return {
    id: row?.id ?? null,
    organizationId: member.organizationId,
    payload: row ? normalizePayload(row.payload) : emptyPersonalizationPayload(),
  };
}

export function registerJurisdictionRoutes(app: Express): void {
  app.get("/api/me/jurisdiction", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const loaded = await loadPayload(req.clientMemberId!);
      return res.json({ jurisdiction: loaded.payload.jurisdiction });
    } catch (error) {
      console.error("jurisdiction GET failed:", error);
      return res.status(500).json({ error: "Failed to load jurisdiction context" });
    }
  });

  app.put("/api/me/jurisdiction", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid jurisdiction context", details: parsed.error.flatten() });
      }

      const memberId = req.clientMemberId!;
      const loaded = await loadPayload(memberId);
      const payload = normalizePayload({
        ...loaded.payload,
        jurisdiction: {
          state: parsed.data.state,
          macRegion: parsed.data.macRegion,
        },
      });

      if (loaded.id) {
        await db
          .update(memberPersonalization)
          .set({ payload, updatedAt: new Date() })
          .where(eq(memberPersonalization.id, loaded.id));
      } else {
        await db.insert(memberPersonalization).values({
          organizationId: loaded.organizationId,
          memberId,
          payload,
        });
      }

      return res.json({ jurisdiction: payload.jurisdiction });
    } catch (error) {
      console.error("jurisdiction PUT failed:", error);
      return res.status(500).json({ error: "Failed to save jurisdiction context" });
    }
  });
}
