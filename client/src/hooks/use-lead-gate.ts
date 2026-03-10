import { useState, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { EmailPdfPayload } from "@/lib/downloadPdf";

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
  }
}

async function trackUsage(name: string, email: string, toolName: string): Promise<void> {
  try {
    await fetch("/api/usage-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, toolName }),
    });
  } catch {
  }
}

async function emailPdf(email: string, name: string, payload: EmailPdfPayload): Promise<void> {
  try {
    await fetch("/api/pdf/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, ...payload }),
    });
  } catch {
  }
}

export interface LeadGateState {
  open: boolean;
  nameVal: string;
  emailVal: string;
  isPending: boolean;
  isReturning: boolean;
  setOpen: (open: boolean) => void;
  setNameVal: (v: string) => void;
  setEmailVal: (v: string) => void;
  onSubmit: () => void;
  toolName: string;
}

export function useLeadGate(toolName: string) {
  const [open, setOpen] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const pendingFnRef = useRef<(() => void) | null>(null);
  const pendingEmailPdfRef = useRef<(() => EmailPdfPayload | null) | null>(null);

  const capture = useCallback(
    (fn: () => void, getEmailPdf?: () => EmailPdfPayload | null) => {
      const stored = getStoredLead();
      pendingFnRef.current = fn;
      pendingEmailPdfRef.current = getEmailPdf ?? null;
      if (stored) {
        setNameVal(stored.name);
        setEmailVal(stored.email);
        setIsReturning(true);
      } else {
        setNameVal("");
        setEmailVal("");
        setIsReturning(false);
      }
      setOpen(true);
    },
    []
  );

  const onSubmit = useCallback(async () => {
    if (!nameVal.trim() || !emailVal.trim()) return;
    setIsPending(true);
    const lead = { name: nameVal.trim(), email: emailVal.trim() };
    const isFirstTime = !getStoredLead();

    storeLead(lead);

    trackUsage(lead.name, lead.email, toolName).catch(() => {});

    if (isFirstTime) {
      await submitLead(lead.name, lead.email, toolName);
    }

    const getEmailPdfFn = pendingEmailPdfRef.current;
    if (isFirstTime && getEmailPdfFn) {
      const payload = getEmailPdfFn();
      if (payload) {
        emailPdf(lead.email, lead.name, payload).catch(() => {});
      }
    }

    setIsPending(false);
    setOpen(false);
    const fn = pendingFnRef.current;
    pendingFnRef.current = null;
    pendingEmailPdfRef.current = null;
    if (fn) fn();
  }, [nameVal, emailVal, toolName]);

  const gateState: LeadGateState = {
    open,
    nameVal,
    emailVal,
    isPending,
    isReturning,
    setOpen,
    setNameVal,
    setEmailVal,
    onSubmit,
    toolName,
  };

  return { capture, gateState };
}
