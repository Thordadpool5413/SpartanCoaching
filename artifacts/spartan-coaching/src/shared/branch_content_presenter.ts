/**
 * Branch Profitability Content Presenter
 *
 * Assembles user-facing educational content for screen, print, PDF, and export.
 * All content originates from the governed claim registry — no free-form strings.
 *
 * Rules:
 * 1. Only export functions that accept a claimId (or a set of structured inputs)
 *    and return governed content.
 * 2. Never assemble strings from free-form text inside this file.
 * 3. If a sentence contains a number that comes from the engine result, the
 *    caller must supply that number — this file does not recalculate.
 */

import { getClaimText, getAllClaims, type ContentClaim } from "@workspace/branch-engine/content";
import { assertClaimRenderable } from "./branch_content_validator";

// ─── Safe claim text retrieval ────────────────────────────────────────────────

/**
 * Returns the claimText for a given claimId after validation.
 * Throws if the claimId is unknown or the claim is not renderable.
 */
export function presentClaim(claimId: string): string {
  assertClaimRenderable(claimId);
  return getClaimText(claimId);
}

// ─── Tooltip text map ─────────────────────────────────────────────────────────

/**
 * Returns all tooltip claimIds and their governed text for use in the UI.
 * Keys match the input field names used in BranchInputs.
 */
export const TOOLTIP_CONTENT = {
  targetADC:                  () => presentClaim("tip.targetADC"),
  avgLengthOfStayDays:        () => presentClaim("tip.avgLOS"),
  targetOperatingMarginPercent: () => presentClaim("tip.targetMargin"),
  rhcDay1To60:                () => presentClaim("tip.rhcDay1"),
  rhcDay61Plus:               () => presentClaim("tip.rhcDay61"),
  pharmacyPerDay:             () => presentClaim("tip.pharmacy"),
  dmePerDay:                  () => presentClaim("tip.dme"),
  suppliesPerDay:             () => presentClaim("tip.supplies"),
  travelPerDay:               () => presentClaim("tip.travel"),
  otherPerDay:                () => presentClaim("tip.other"),
  monthlyNonPayrollOverhead:  () => presentClaim("tip.overhead"),
  startingCapital:            () => presentClaim("tip.startingCapital"),
  admissionsPerMarketerPerMonth: () => presentClaim("tip.admissionsPerMarketer"),
} as const;

// ─── Glossary / How-to-Read entries ──────────────────────────────────────────

export interface GlossaryEntry {
  term: string;
  def: string;
  requiresDisclaimer: boolean;
}

/**
 * Returns all HOW_TO_READ glossary entries, sourced entirely from the claim
 * registry. No free-form strings. The display layer renders these; it may not
 * substitute its own text.
 */
export function getGlossaryEntries(): GlossaryEntry[] {
  return [
    {
      term: "Annual Profit",
      def: presentClaim("glossary.annualProfit"),
      requiresDisclaimer: false,
    },
    {
      term: "Operating Margin",
      def: presentClaim("glossary.operatingMargin"),
      requiresDisclaimer: true,
    },
    {
      term: "Break-Even ADC",
      def: presentClaim("glossary.breakEvenADC"),
      requiresDisclaimer: false,
    },
    {
      term: "Target Margin ADC",
      def: presentClaim("glossary.targetMarginADC"),
      requiresDisclaimer: false,
    },
    {
      term: "Cash Runway",
      def: presentClaim("glossary.cashRunway"),
      requiresDisclaimer: true,
    },
    {
      term: "Admissions Needed",
      def: presentClaim("glossary.admissionsNeeded"),
      requiresDisclaimer: false,
    },
  ];
}

// ─── Runway model disclaimer ──────────────────────────────────────────────────

export function getRunwayDisclaimer(): string {
  return presentClaim("assumption.runwayRamp");
}

// ─── Staffing model note ──────────────────────────────────────────────────────

export function getStaffingModelNote(): string {
  return presentClaim("assumption.staffingScaling");
}

// ─── Regulatory note ─────────────────────────────────────────────────────────

export function getHospiceTeamRegulatoryNote(): string {
  return presentClaim("regulatory.hospiceTeamRequired");
}

// ─── Content summary for export / PDF ────────────────────────────────────────

export interface PresenterContentBlock {
  sectionTitle: string;
  body: string;
}

/**
 * Returns an array of content blocks suitable for inclusion in a PDF or text
 * export. All text originates from the claim registry.
 */
export function getExportContentBlocks(): PresenterContentBlock[] {
  return [
    {
      sectionTitle: "About This Model",
      body: [
        presentClaim("assumption.runwayRamp"),
        presentClaim("assumption.staffingScaling"),
      ].join(" "),
    },
    {
      sectionTitle: "Revenue Rate Reference",
      body: [
        presentClaim("tip.rhcDay1"),
        presentClaim("tip.rhcDay61"),
      ].join(" "),
    },
    {
      sectionTitle: "Key Formula Definitions",
      body: [
        `Annual Profit: ${presentClaim("glossary.annualProfit")}`,
        `Operating Margin: ${presentClaim("glossary.operatingMargin")}`,
        `Break-Even ADC: ${presentClaim("glossary.breakEvenADC")}`,
        `Target Margin ADC: ${presentClaim("glossary.targetMarginADC")}`,
        `Admissions Needed: ${presentClaim("glossary.admissionsNeeded")}`,
        `Cash Runway: ${presentClaim("glossary.cashRunway")}`,
      ].join("\n"),
    },
  ];
}
