import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const BASE = "/api/clinical/patient-review/sessions";
const MIME: Record<string, string> = {
  pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", txt: "text/plain",
};
type Policy = { id: string; source: string; title: string; documentId: string; version: string; retiredAt: string | null; effectiveAt: string | null; educationalBaseline: boolean };
type Review = { output: Record<string, unknown>; watermark: string; coveragePolicy: { sourceUrl: string; documentId: string; version: string } };

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", cache: "no-store", ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export default function PatientReview() {
  const [available, setAvailable] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policyId, setPolicyId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState("");
  const activeId = useRef("");
  const [result, setResult] = useState<Review | null>(null);
  const [challenge, setChallenge] = useState<{ challengeId: string; challengeToken: string } | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([json<{ clinical: { patientDocumentsAccepted: boolean } }>("/api/ai-tools"),
      json<{ snapshots: Policy[] }>("/api/clinical/coverage/snapshots")]).then(([capability, coverage]) => {
      setAvailable(capability.clinical.patientDocumentsAccepted);
      setPolicies(coverage.snapshots.filter((item) => item.source === "CMS_MCD" && !item.retiredAt && !item.educationalBaseline && item.effectiveAt && new Date(item.effectiveAt) <= new Date()));
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Clinical policies could not load."));
    const cleanup = () => {
      if (activeId.current) void fetch(`${BASE}/${activeId.current}`, { method: "DELETE", credentials: "include", keepalive: true, cache: "no-store" });
      activeId.current = "";
    };
    window.addEventListener("pagehide", cleanup);
    return () => { window.removeEventListener("pagehide", cleanup); cleanup(); };
  }, []);

  async function close() {
    const id = activeId.current;
    if (id) {
      await json(`${BASE}/${id}`, { method: "DELETE" });
      activeId.current = "";
    }
    setSessionId(""); setResult(null); setFiles([]); setConfirmed(false);
  }

  async function review() {
    if (!policyId || !files.length || !confirmed) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const created = await json<{ sessionId: string }>(BASE, { method: "POST", body: JSON.stringify({ coverageSnapshotId: policyId }) });
      activeId.current = created.sessionId; setSessionId(created.sessionId);
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        const contentType = MIME[extension];
        if (!contentType || file.size > 25 * 1024 * 1024) throw new Error("Each file must be PDF, DOCX, PNG, JPEG, or TXT and no larger than 25 MB.");
        const uploaded = await fetch(`${BASE}/${created.sessionId}/documents`, { method: "POST", credentials: "include",
          cache: "no-store", headers: { "Content-Type": contentType }, body: file });
        if (!uploaded.ok) {
          const body = await uploaded.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(body.error?.message ?? "Document upload failed.");
        }
      }
      const completed = await json<{ result: Review }>(`${BASE}/${created.sessionId}/finalize`, {
        method: "POST", body: JSON.stringify({ confirmedHumanReview: true }),
      });
      activeId.current = ""; setSessionId(""); setFiles([]);
      setResult(completed.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed.");
      if (activeId.current) {
        try { await close(); } catch { setError("Review stopped. Secure cleanup is being retried; contact support if the error persists."); }
      }
    } finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-4xl space-y-6 px-5 py-12 text-foreground">
    <SEO title="Patient record review | Spartan Coaching" description="Private clinical review workspace" />
    <Link href="/tools/ai" className="text-sm underline">← Advanced tools</Link>
    <header className="space-y-3"><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Clinical workspace</p>
      <h1 className="text-3xl font-black">Patient record review</h1>
      <p className="max-w-2xl text-muted-foreground">Compare documented facts with a current CMS policy. This draft cannot determine hospice eligibility, diagnosis codes, medication orders, or billing. A qualified clinician must review it.</p></header>
    {!available ? <Card className="p-6">Patient uploads are unavailable until covered storage, file scanning, and model controls are configured. Use the <Link href="/tools/ai/medical-record-lcd-verifier" className="underline">deidentified tool</Link> meanwhile.</Card> : <>
      <Card className="space-y-4 p-6"><h2 className="font-bold">1. Verify your clinical session</h2>
        <p className="text-sm text-muted-foreground">A recent email code is required for each protected review session.</p>
        {!verified && (!challenge ? <Button disabled={busy} onClick={() => void json<typeof challenge>("/api/clinical/mfa/request", { method: "POST", body: "{}" }).then(setChallenge).catch((caught) => setError(String(caught)))}>Email security code</Button>
          : <div className="flex gap-2"><input aria-label="Security code" inputMode="numeric" maxLength={6} className="rounded border bg-background p-2" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
            <Button disabled={code.length !== 6} onClick={() => void json("/api/clinical/mfa/verify", { method: "POST", body: JSON.stringify({ ...challenge, code }) }).then(() => setVerified(true)).catch((caught) => setError(String(caught)))}>Verify</Button></div>)}
        {verified && <p role="status">Clinical session verified.</p>}</Card>
      <Card className="space-y-4 p-6"><h2 className="font-bold">2. Select policy and records</h2>
        <label className="block text-sm">CMS policy<select className="mt-2 w-full rounded border bg-background p-3" value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
          <option value="">Select a current CMS policy</option>{policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.title} · {policy.documentId} · {policy.version}</option>)}
        </select></label>
        {!policies.length && <p className="text-sm text-amber-700">No current CMS MCD snapshot is loaded. Ask an administrator to sync coverage before patient review.</p>}
        <label className="block text-sm">Record files<input className="mt-2 block w-full" type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.txt" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} /></label>
        <p className="text-xs text-muted-foreground">Up to five files, 25 MB each. Filenames stay on this device. The server temporarily processes uploads, then verifies deletion before returning a result. Close this page to request early deletion.</p>
        {files.map((file, index) => <p className="text-sm" key={`${file.name}-${index}`}>{index + 1}. {file.name}</p>)}
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I am authorized to review these records and will have a qualified clinician verify the draft.</label>
        <div className="flex gap-3"><Button disabled={!verified || !policyId || !files.length || !confirmed || busy} onClick={() => void review()}>{busy ? "Reviewing securely…" : "Review records"}</Button>
          <Button variant="outline" disabled={busy} onClick={() => void close().catch(() => setError("Deletion could not be verified; cleanup will be retried."))}>Close and delete</Button></div>
      </Card></>}
    {sessionId && <p role="status">Session active. Uploaded content is temporary and will be deleted after the review or when you close the workspace.</p>}
    {error && <p role="alert" className="rounded border border-destructive p-4 text-destructive">{error}</p>}
    {result && <Card className="space-y-5 p-6"><h2 className="text-xl font-bold">Draft evidence review</h2><p className="text-sm text-amber-700">{result.watermark}</p>
      {Object.entries(result.output).map(([heading, value]) => <section key={heading} className="border-t pt-3"><h3 className="font-semibold">{heading.replace(/([a-z])([A-Z])/g, "$1 $2")}</h3><pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</pre></section>)}
      <a className="underline" href={result.coveragePolicy.sourceUrl} target="_blank" rel="noopener noreferrer">CMS source: {result.coveragePolicy.documentId} ({result.coveragePolicy.version})</a>
      <Button variant="outline" onClick={() => setResult(null)}>Clear result from this screen</Button></Card>}
  </main>;
}
