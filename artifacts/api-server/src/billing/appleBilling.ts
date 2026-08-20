import type { Express } from "express";
import { and, eq, ne } from "drizzle-orm";
import {
  AutoRenewStatus,
  Environment,
  SignedDataVerifier,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";
import { clientMembers, clientOrganizations } from "@workspace/db";
import {
  ELITE_WEEKLY_PLAN,
  STANDARD_WEEKLY_PLAN,
} from "@workspace/field-kit-catalog";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, type AuthedRequest } from "../auth/middleware";
import { authLimit } from "../rateLimits";

const BUNDLE_ID = "com.spartancoaching.fieldkit";
const VERIFY_BODY = z.object({ signedTransaction: z.string().min(80).max(80_000) });
const CLAIM_BODY = VERIFY_BODY.extend({
  appAccountToken: z.string().uuid().optional(),
});
const NOTIFICATION_BODY = z.object({ signedPayload: z.string().min(80).max(200_000) });

type VerifiedAppleTransaction = {
  payload: JWSTransactionDecodedPayload;
  environment: Environment;
};

function rootCertificates(): Buffer[] {
  const raw = process.env.APPLE_ROOT_CERTIFICATES_BASE64?.trim();
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((value) => Buffer.from(value, "base64"))
    .filter((value) => value.length > 0);
}

function verifier(environment: Environment): SignedDataVerifier {
  const roots = rootCertificates();
  if (!roots.length) throw new Error("APPLE_ROOT_CERTIFICATES_BASE64 is not configured");
  const appAppleId = Number(process.env.APPLE_APP_ID);
  if (environment === Environment.PRODUCTION && (!Number.isInteger(appAppleId) || appAppleId <= 0)) {
    throw new Error("APPLE_APP_ID is not configured");
  }
  return new SignedDataVerifier(
    roots,
    true,
    environment,
    process.env.APPLE_BUNDLE_ID?.trim() || BUNDLE_ID,
    environment === Environment.PRODUCTION ? appAppleId : undefined,
  );
}

async function verifyTransaction(signedTransaction: string): Promise<VerifiedAppleTransaction> {
  try {
    return {
      payload: await verifier(Environment.PRODUCTION).verifyAndDecodeTransaction(signedTransaction),
      environment: Environment.PRODUCTION,
    };
  } catch (productionError) {
    try {
      return {
        payload: await verifier(Environment.SANDBOX).verifyAndDecodeTransaction(signedTransaction),
        environment: Environment.SANDBOX,
      };
    } catch {
      throw productionError;
    }
  }
}

function planForProduct(productId: string | undefined) {
  if (productId === STANDARD_WEEKLY_PLAN.appleProductId) return STANDARD_WEEKLY_PLAN;
  if (productId === ELITE_WEEKLY_PLAN.appleProductId) return ELITE_WEEKLY_PLAN;
  return null;
}

function completePayload(
  value: JWSTransactionDecodedPayload,
  renewal?: JWSRenewalInfoDecodedPayload,
) {
  const plan = planForProduct(value.productId);
  if (!plan || !value.originalTransactionId || !value.transactionId || !value.expiresDate) {
    throw new Error("The Apple transaction is missing required subscription fields");
  }
  const gracePeriodEnd = renewal?.isInBillingRetryPeriod && renewal.gracePeriodExpiresDate
    ? new Date(renewal.gracePeriodExpiresDate)
    : null;
  const transactionEnd = new Date(value.expiresDate);
  const accessEnd = gracePeriodEnd && gracePeriodEnd > transactionEnd
    ? gracePeriodEnd
    : transactionEnd;
  return {
    plan,
    originalTransactionId: value.originalTransactionId,
    transactionId: value.transactionId,
    expiresDate: accessEnd,
    active: !value.revocationDate && !value.isUpgraded && accessEnd.getTime() > Date.now(),
    cancelAtPeriodEnd: renewal?.autoRenewStatus === AutoRenewStatus.OFF,
    signedAt: value.signedDate ? new Date(value.signedDate) : new Date(),
  };
}

async function applyTransaction(input: {
  verified: VerifiedAppleTransaction;
  renewal?: JWSRenewalInfoDecodedPayload;
  memberId?: number;
  requireAccountBinding: boolean;
  eventSignedAt?: Date;
}) {
  const decodedTransaction = completePayload(input.verified.payload, input.renewal);
  const transaction = {
    ...decodedTransaction,
    signedAt:
      input.eventSignedAt && input.eventSignedAt > decodedTransaction.signedAt
        ? input.eventSignedAt
        : decodedTransaction.signedAt,
  };
  let organizationId: number | null = null;

  if (input.memberId) {
    const [member] = await db
      .select({ organizationId: clientMembers.organizationId, appleAccountToken: clientMembers.appleAccountToken })
      .from(clientMembers)
      .where(eq(clientMembers.id, input.memberId))
      .limit(1);
    if (!member) throw new Error("Member not found");
    if (
      input.requireAccountBinding &&
      input.verified.payload.appAccountToken?.toLowerCase() !== member.appleAccountToken.toLowerCase()
    ) {
      throw new Error("The Apple transaction is not bound to this Spartan account");
    }
    organizationId = member.organizationId;
  } else {
    const [owner] = await db
      .select({ id: clientOrganizations.id })
      .from(clientOrganizations)
      .where(eq(clientOrganizations.appleOriginalTransactionId, transaction.originalTransactionId))
      .limit(1);
    organizationId = owner?.id ?? null;
  }

  if (!organizationId) return { applied: false, reason: "UNCLAIMED_TRANSACTION" as const };

  const [conflict] = await db
    .select({ id: clientOrganizations.id })
    .from(clientOrganizations)
    .where(
      and(
        eq(clientOrganizations.appleOriginalTransactionId, transaction.originalTransactionId),
        ne(clientOrganizations.id, organizationId),
      ),
    )
    .limit(1);
  if (conflict) throw new Error("This Apple subscription belongs to another Spartan account");

  const [organization] = await db
    .select()
    .from(clientOrganizations)
    .where(eq(clientOrganizations.id, organizationId))
    .limit(1);
  if (!organization) throw new Error("Organization not found");
  if (organization.type !== "personal") {
    throw new Error("Company seats are activated under contract, not an individual Apple subscription");
  }
  if (
    input.requireAccountBinding &&
    organization.stripeSubscriptionId &&
    ["active", "trialing"].includes(organization.billingStatus || "")
  ) {
    throw new Error("Manage the existing web subscription before starting an Apple subscription");
  }

  const ownsThisAppleSubscription =
    !organization.appleOriginalTransactionId ||
    organization.appleOriginalTransactionId === transaction.originalTransactionId;
  if (!ownsThisAppleSubscription) {
    throw new Error("This account is already linked to a different Apple subscription");
  }
  if (
    organization.appleLastSignedAt &&
    transaction.signedAt <= organization.appleLastSignedAt
  ) {
    return {
      applied: false,
      active: organization.billingStatus === "active",
      reason: "STALE_TRANSACTION" as const,
    };
  }

  const patch = transaction.active
    ? {
        status: "active",
        pipelineStatus: "won",
        activatedAt: organization.activatedAt || new Date(),
        billingPlan: transaction.plan.billingPlan,
        billingStatus: "active",
        billingProvider: "apple",
        currentPeriodEnd: transaction.expiresDate,
        cancelAtPeriodEnd: transaction.cancelAtPeriodEnd,
        appleOriginalTransactionId: transaction.originalTransactionId,
        appleLastTransactionId: transaction.transactionId,
        appleLastSignedAt: transaction.signedAt,
        appleProductId: input.verified.payload.productId,
        appleEnvironment: input.verified.environment,
      }
    : {
        status: "expired",
        pipelineStatus: "follow_up",
        billingStatus: input.verified.payload.revocationDate ? "canceled" : "expired",
        billingProvider: "apple",
        currentPeriodEnd: transaction.expiresDate,
        cancelAtPeriodEnd: true,
        appleOriginalTransactionId: transaction.originalTransactionId,
        appleLastTransactionId: transaction.transactionId,
        appleLastSignedAt: transaction.signedAt,
        appleProductId: input.verified.payload.productId,
        appleEnvironment: input.verified.environment,
      };

  await db
    .update(clientOrganizations)
    .set(patch)
    .where(eq(clientOrganizations.id, organizationId));

  return {
    applied: true,
    active: transaction.active,
    tier: transaction.plan.id === ELITE_WEEKLY_PLAN.id ? "elite" : "standard",
    productId: input.verified.payload.productId,
    expiresAt: transaction.expiresDate.toISOString(),
  };
}

function assertOptionalAccountToken(
  verified: VerifiedAppleTransaction,
  appAccountToken?: string,
) {
  if (!appAccountToken) return;
  if (verified.payload.appAccountToken?.toLowerCase() !== appAccountToken.toLowerCase()) {
    throw new Error("The Apple purchase does not match this device purchase session");
  }
}

function previewTransaction(verified: VerifiedAppleTransaction) {
  const transaction = completePayload(verified.payload);
  return {
    verified: true,
    active: transaction.active,
    tier: transaction.plan.id === ELITE_WEEKLY_PLAN.id ? "elite" as const : "standard" as const,
    productId: verified.payload.productId,
    expiresAt: transaction.expiresDate.toISOString(),
  };
}

export function appleBillingConfigured() {
  return rootCertificates().length > 0 && Number(process.env.APPLE_APP_ID) > 0;
}

export function registerAppleBillingRoutes(app: Express) {
  app.get("/api/billing/apple/health", (_request, response) => {
    const configured = appleBillingConfigured();
    return response.status(configured ? 200 : 503).json({
      status: configured ? "ok" : "not_configured",
      configured,
      bundleId: process.env.APPLE_BUNDLE_ID?.trim() || BUNDLE_ID,
      products: [STANDARD_WEEKLY_PLAN.appleProductId, ELITE_WEEKLY_PLAN.appleProductId],
    });
  });

  // Public product catalog. StoreKit supplies the localized prices on device.
  // No account is required to inspect or purchase an Apple subscription.
  app.get("/api/billing/apple/catalog", (_request, response) => {
    return response.json({
      configured: appleBillingConfigured(),
      products: [
        { id: STANDARD_WEEKLY_PLAN.appleProductId, tier: "standard" },
        { id: ELITE_WEEKLY_PLAN.appleProductId, tier: "elite" },
      ],
    });
  });

  // Verify a completed StoreKit purchase before the customer creates or signs
  // into a Spartan account. This endpoint does not grant product access.
  app.post("/api/billing/apple/guest-verify", authLimit, async (request, response) => {
    try {
      if (!appleBillingConfigured()) {
        return response.status(503).json({ error: "Apple billing verification is not configured", code: "APPLE_BILLING_NOT_CONFIGURED" });
      }
      const body = CLAIM_BODY.parse(request.body);
      const verified = await verifyTransaction(body.signedTransaction);
      assertOptionalAccountToken(verified, body.appAccountToken);
      return response.json(previewTransaction(verified));
    } catch (error: any) {
      console.warn("Guest Apple transaction verification rejected", { message: error?.message || "unknown" });
      return response.status(422).json({ error: error?.message || "Apple transaction could not be verified", code: "APPLE_TRANSACTION_REJECTED" });
    }
  });

  app.get("/api/billing/apple/config", requireAuth, async (request: AuthedRequest, response) => {
    const member = request.fieldKit?.member;
    if (!member) return response.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    const [record] = await db
      .select({ appleAccountToken: clientMembers.appleAccountToken })
      .from(clientMembers)
      .where(eq(clientMembers.id, member.id))
      .limit(1);
    if (!record) return response.status(404).json({ error: "Member not found" });
    return response.json({
      configured: appleBillingConfigured(),
      appAccountToken: record.appleAccountToken,
      products: [
        { id: STANDARD_WEEKLY_PLAN.appleProductId, tier: "standard" },
        { id: ELITE_WEEKLY_PLAN.appleProductId, tier: "elite" },
      ],
    });
  });

  app.post("/api/billing/apple/verify", requireAuth, authLimit, async (request: AuthedRequest, response) => {
    try {
      if (!appleBillingConfigured()) {
        return response.status(503).json({ error: "Apple billing verification is not configured", code: "APPLE_BILLING_NOT_CONFIGURED" });
      }
      const body = VERIFY_BODY.parse(request.body);
      const member = request.fieldKit?.member;
      if (!member) return response.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
      const result = await applyTransaction({
        verified: await verifyTransaction(body.signedTransaction),
        memberId: member.id,
        requireAccountBinding: true,
      });
      return response.json(result);
    } catch (error: any) {
      console.warn("Apple transaction verification rejected", { message: error?.message || "unknown" });
      return response.status(422).json({ error: error?.message || "Apple transaction could not be verified", code: "APPLE_TRANSACTION_REJECTED" });
    }
  });

  // Claim a purchase that was completed before account creation. StoreKit's
  // signed transaction is the proof of purchase. applyTransaction prevents an
  // original transaction from being attached to more than one organization.
  app.post("/api/billing/apple/claim", requireAuth, authLimit, async (request: AuthedRequest, response) => {
    try {
      if (!appleBillingConfigured()) {
        return response.status(503).json({ error: "Apple billing verification is not configured", code: "APPLE_BILLING_NOT_CONFIGURED" });
      }
      const body = CLAIM_BODY.parse(request.body);
      const member = request.fieldKit?.member;
      if (!member) return response.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
      const verified = await verifyTransaction(body.signedTransaction);
      assertOptionalAccountToken(verified, body.appAccountToken);
      const result = await applyTransaction({
        verified,
        memberId: member.id,
        requireAccountBinding: false,
      });
      return response.json(result);
    } catch (error: any) {
      console.warn("Apple transaction claim rejected", { message: error?.message || "unknown" });
      return response.status(422).json({ error: error?.message || "Apple transaction could not be claimed", code: "APPLE_TRANSACTION_REJECTED" });
    }
  });

  app.post("/api/billing/apple/notifications", async (request, response) => {
    try {
      if (!appleBillingConfigured()) return response.sendStatus(503);
      const { signedPayload } = NOTIFICATION_BODY.parse(request.body);
      let decoded;
      let environment: Environment;
      try {
        environment = Environment.PRODUCTION;
        decoded = await verifier(environment).verifyAndDecodeNotification(signedPayload);
      } catch (productionError) {
        try {
          environment = Environment.SANDBOX;
          decoded = await verifier(environment).verifyAndDecodeNotification(signedPayload);
        } catch {
          throw productionError;
        }
      }
      if (decoded.data?.signedTransactionInfo) {
        const renewal = decoded.data.signedRenewalInfo
          ? await verifier(environment).verifyAndDecodeRenewalInfo(decoded.data.signedRenewalInfo)
          : undefined;
        await applyTransaction({
          verified: {
            payload: await verifier(environment).verifyAndDecodeTransaction(decoded.data.signedTransactionInfo),
            environment,
          },
          renewal,
          requireAccountBinding: false,
          eventSignedAt: decoded.signedDate ? new Date(decoded.signedDate) : undefined,
        });
      }
      return response.sendStatus(200);
    } catch (error: any) {
      console.warn("Apple server notification rejected", { message: error?.message || "unknown" });
      return response.sendStatus(400);
    }
  });
}
