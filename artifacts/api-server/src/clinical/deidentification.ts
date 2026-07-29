export type PotentialIdentifier =
  | "EMAIL_ADDRESS"
  | "PHONE_NUMBER"
  | "SOCIAL_SECURITY_NUMBER"
  | "MEDICAL_RECORD_NUMBER"
  | "DATE_OF_BIRTH"
  | "PATIENT_NAME"
  | "POSTAL_ADDRESS";

type IdentifierRule = {
  code: PotentialIdentifier;
  pattern: RegExp;
};

const IDENTIFIER_RULES: readonly IdentifierRule[] = [
  {
    code: "EMAIL_ADDRESS",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    code: "PHONE_NUMBER",
    pattern:
      /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}\b/,
  },
  {
    code: "SOCIAL_SECURITY_NUMBER",
    pattern: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/,
  },
  {
    code: "MEDICAL_RECORD_NUMBER",
    pattern:
      /\b(?:mrn|medical\s+record|record\s+number|patient\s+id)\s*(?:#|number|no\.?|:|-)?\s*[A-Z0-9][A-Z0-9-]{3,}\b/i,
  },
  {
    code: "DATE_OF_BIRTH",
    pattern:
      /\b(?:dob|date\s+of\s+birth|born)\s*(?:is|:|-)?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4})\b/i,
  },
  {
    code: "PATIENT_NAME",
    pattern:
      /\b(?:patient|resident|beneficiary|member)(?:\s+name)?\s*(?:is|:|-)\s*[A-Z][A-Za-z'-]{1,}\s+[A-Z][A-Za-z'-]{1,}\b/i,
  },
  {
    code: "POSTAL_ADDRESS",
    pattern:
      /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way)\b/i,
  },
] as const;

function visitStrings(
  value: unknown,
  visit: (text: string) => void,
  depth = 0,
): void {
  if (depth > 20 || value === null || value === undefined) return;
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) visitStrings(entry, visit, depth + 1);
    return;
  }
  if (typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      visitStrings(entry, visit, depth + 1);
    }
  }
}

/**
 * Detects common direct identifiers without returning or logging the matched text.
 * This is a safety backstop for de-identified demonstration mode, not a
 * certification that arbitrary free text satisfies HIPAA de-identification.
 */
export function findPotentialIdentifiers(
  input: unknown,
): PotentialIdentifier[] {
  const findings = new Set<PotentialIdentifier>();
  visitStrings(input, (text) => {
    for (const rule of IDENTIFIER_RULES) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(text)) findings.add(rule.code);
    }
  });
  return [...findings];
}
