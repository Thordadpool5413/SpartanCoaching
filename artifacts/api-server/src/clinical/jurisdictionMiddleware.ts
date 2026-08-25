import type { NextFunction, Response } from "express";
import { eq } from "drizzle-orm";
import {
  getSpartanAiTool,
  isClinicalTool,
} from "@workspace/spartan-ai-tools";
import { runWithClinicalJurisdiction } from "@workspace/spartan-ai-tools/server";
import { memberPersonalization } from "@workspace/db";
import { db } from "../db";
import type { AuthedRequest } from "../auth/middleware";
import { normalizePayload } from "../personalization/personalizationEngine";

export async function requireClinicalJurisdictionContext(
  request: AuthedRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const tool = getSpartanAiTool(String(request.params.toolId || ""));
  if (!tool || !isClinicalTool(tool)) {
    next();
    return;
  }

  if (!request.clientMemberId) {
    next();
    return;
  }

  try {
    const [row] = await db
      .select({ payload: memberPersonalization.payload })
      .from(memberPersonalization)
      .where(eq(memberPersonalization.memberId, request.clientMemberId))
      .limit(1);
    const jurisdiction = normalizePayload(row?.payload).jurisdiction;

    if (!jurisdiction.state || !jurisdiction.macRegion) {
      response.status(428).json({
        error: {
          code: "JURISDICTION_CONTEXT_REQUIRED",
          message: "Set your primary state and Medicare Administrative Contractor region in Account before using clinical education tools.",
          retryable: false,
        },
      });
      return;
    }

    runWithClinicalJurisdiction(
      { state: jurisdiction.state, macRegion: jurisdiction.macRegion },
      () => next(),
    );
  } catch (error) {
    console.error("clinical jurisdiction middleware failed:", error);
    response.status(503).json({
      error: {
        code: "JURISDICTION_CONTEXT_UNAVAILABLE",
        message: "Clinical jurisdiction context could not be verified. Try again before using clinical guidance.",
        retryable: true,
      },
    });
  }
}
