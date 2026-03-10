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
  const pendingFnRef = useRef<(() => void) | null>(null);
  const pendingEmailPdfRef = useRef<(() => EmailPdfPayload | null) | null>(null);

  const capture = useCallback(
    (fn: () => void, getEmailPdf?: () => EmailPdfPayload | null) => {
      const stored = getStoredLead();
      if (stored) {
        fn();
        return;
      }
      pendingFnRef.current = fn;
      pendingEmailPdfRef.current = getEmailPdf ?? null;
      setOpen(true);
    },
    []
  );

  const onSubmit = useCallback(async () => {
    if (!nameVal.trim() || !emailVal.trim()) return;
    setIsPending(true);
    const lead = { name: nameVal.trim(), email: emailVal.trim() };
    await submitLead(lead.name, lead.email, toolName);
    storeLead(lead);

    const getEmailPdf = pendingEmailPdfRef.current;
    if (getEmailPdf) {
      const payload = getEmailPdf();
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
    setOpen,
    setNameVal,
    setEmailVal,
    onSubmit,
    toolName,
  };

  return { capture, gateState };
}
