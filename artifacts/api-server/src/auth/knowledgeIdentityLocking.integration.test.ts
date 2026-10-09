import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  databaseSuite,
  databaseFixture,
} from "../knowledge/persistence/testing.test";
import { readKnowledge } from "../knowledge/control/reads";
it("account delete and seat transfer lock identities before private children", () => {
  const auth = readFileSync(
      new URL("../routes/authRoutes.ts", import.meta.url),
      "utf8",
    ),
    seat = readFileSync(
      new URL("../routes/companySeatTransitionRoutes.ts", import.meta.url),
      "utf8",
    );
  const deletion = auth.slice(auth.indexOf("const anonymizedEmail"));
  expect(deletion.indexOf("SELECT id FROM client_organizations")).toBeLessThan(
    deletion.indexOf("tx.delete(coachSharedSummaries)"),
  );
  expect(seat.indexOf("SELECT id FROM client_organizations")).toBeLessThan(
    seat.indexOf("tx.update(coachConversations)"),
  );
});
databaseSuite(
  "K1B canonical member projection and tenant read isolation",
  () => {
    const db = databaseFixture();
    it("current-member tenant derives from identity and cannot use a cursor or role as tenant proof", async () => {
      const token = db.fixture.tokens.get(db.fixture.subjects[0])!;
      const read = await readKnowledge(db.pool, token, "tenant", null, {
        synthetic: true,
      });
      expect("scope" in read && read.scope.id).toBe(db.fixture.scopeId);
      await expect(
        readKnowledge(
          db.pool,
          token,
          "tenant",
          {
            kind: "sources",
            domain: "MAC_COVERAGE",
            organizationId: db.second.organizationId,
          },
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_CONTRACT_INVALID");
      const foreign = Buffer.from(
        JSON.stringify({
          scopeId: db.second.scopeId,
          kind: "sources",
          domain: "MAC_COVERAGE",
          versionId: null,
          last: "synthetic-source",
          revision: 1,
        }),
      ).toString("base64url");
      await expect(
        readKnowledge(
          db.pool,
          token,
          "tenant",
          { kind: "sources", domain: "MAC_COVERAGE", cursor: foreign },
          { synthetic: true },
        ),
      ).rejects.toThrow("KNOWLEDGE_CONTRACT_INVALID");
    });
  },
);
