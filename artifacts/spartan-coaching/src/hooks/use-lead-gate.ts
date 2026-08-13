import { useState, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { EmailPdfPayload } from "@/lib/downloadPdf";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "spartan_lead";

interface StoredLead {
  name: string;
  email: string;
}

function getStoredLead(): StoredLead | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLead;
  } catch {
    return null;
  }
}

function storeLead(lead: StoredLead): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lead));
  } catch {
    // ignore
  }
}

async function submitLead(name: string, email: string, toolName: string): Promise<void> {
  try {
    await apiRequest("POST", "/api/resource-leads", {
      name,
      email,
      resourceTitle: toolName,
      resourceId: 0,
    });
  } catch {
    // ignore
  }
}

async function trackUsage(name: string, email: string, toolName: string): Promise<void> {
  try {
    await fetch("/api/usage-events", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, toolName }),
    });
  } catch {
    // ignore
  }
}

async function emailPdf(email: string, name: string, payload: EmailPdfPayload): Promise<void> {
  try {
    await fetch("/api/pdf/email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, ...payload }),
    });
  } catch {
    // ignore
  }
}

export interface LeadGateState {
  open: boolean;
  nameVal: string;
  emailVal: string;
  /** Optional marketing email — never required for resource delivery (HSP-40) */
  marketingOptIn: boolean;
  isPending: boolean;
  isReturning: boolean;
  setOpen: (open: boolean) => void;
  setNameVal: (v: string) => void;
  setEmailVal: (v: string) => void;
  setMarketingOptIn: (v: boolean) => void;
  onSubmit: () => void;
  toolName: string;
}

/**
 * Export/download gate. Authenticated Membership members skip the name/email dialog
 * and run the action immediately (usage still tracked with their account).
 */
export function useLeadGate(toolName: string) {
  const { isAuthenticated, member, canUseFieldKit } = useAuth();
  const [open, setOpen] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const pendingFnRef = useRef<(() => void) | null>(null);
  const pendingEmailPdfRef = useRef<(() => EmailPdfPayload | null) | null>(null);

  const runWithIdentity = useCallback(
    async (
      name: string,
      email: string,
      fn: () => void,
      getEmailPdf?: (() => EmailPdfPayload | null) | null,
      optInMarketing?: boolean,
    ) => {
      storeLead({ name, email });
      trackUsage(name, email, toolName).catch(() => {});
      // Resource delivery path always captures the lead for the requested tool.
      // Marketing list is only joined when the user explicitly opts in.
      if (optInMarketing) {
        try {
          await apiRequest("POST", "/api/newsletter/subscribe", { email });
        } catch {
          // ignore — resource access still proceeds
        }
      }
      // resource-leads only for non-members (avoid polluting lead CRM with clients)
      if (!isAuthenticated) {
        await submitLead(name, email, toolName);
      }
      if (getEmailPdf) {
        const payload = getEmailPdf();
        if (payload) {
          emailPdf(email, name, payload).catch(() => {});
        }
      }
      fn();
    },
    [toolName, isAuthenticated],
  );

  const capture = useCallback(
    (fn: () => void, getEmailPdf?: () => EmailPdfPayload | null) => {
      // Logged-in Membership clients: no second gate
      if (isAuthenticated && member && canUseFieldKit) {
        void runWithIdentity(member.name, member.email, fn, getEmailPdf ?? null);
        return;
      }

      const stored = getStoredLead();
      pendingFnRef.current = fn;
      pendingEmailPdfRef.current = getEmailPdf ?? null;
      if (stored) {
        setNameVal(stored.name);
        setEmailVal(stored.email);
        setIsReturning(true);
      } else if (member) {
        setNameVal(member.name);
        setEmailVal(member.email);
        setIsReturning(true);
      } else {
        setNameVal("");
        setEmailVal("");
        setIsReturning(false);
      }
      // Marketing opt-in is always optional and defaults off each open.
      setMarketingOptIn(false);
      setOpen(true);
    },
    [isAuthenticated, member, canUseFieldKit, runWithIdentity],
  );

  const onSubmit = useCallback(async () => {
    if (!nameVal.trim() || !emailVal.trim()) return;
    setIsPending(true);
    const lead = { name: nameVal.trim(), email: emailVal.trim() };
    const fn = pendingFnRef.current;
    const getEmailPdfFn = pendingEmailPdfRef.current;
    const optIn = marketingOptIn;
    pendingFnRef.current = null;
    pendingEmailPdfRef.current = null;

    try {
      await runWithIdentity(lead.name, lead.email, () => {}, getEmailPdfFn, optIn);
      setOpen(false);
      setMarketingOptIn(false);
      if (fn) fn();
    } finally {
      setIsPending(false);
    }
  }, [nameVal, emailVal, marketingOptIn, runWithIdentity]);

  const gateState: LeadGateState = {
    open,
    nameVal,
    emailVal,
    marketingOptIn,
    isPending,
    isReturning,
    setOpen,
    setNameVal,
    setEmailVal,
    setMarketingOptIn,
    onSubmit,
    toolName,
  };

  return { capture, gateState };
}
