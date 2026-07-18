import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ContentNotice } from "@/components/ContentNotice";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import type { EmailPdfPayload } from "@/lib/downloadPdf";

export default function WeeklyPlan() {
  const { capture, gateState } = useLeadGate("Weekly Sales Plan");
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO />
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: "Training Resources", href: "/resources" }, { label: "Weekly Plan" }]} />
        <ContentNotice />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          button, nav, header, footer { display: none !important; }
          div.bg-gray-100, div.bg-red-600, div.border-2, div.border {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
        input, textarea {
          border: none;
          border-bottom: 2px dotted #999;
          background: transparent;
          width: 100%;
          padding: 2px 4px;
        }
        input:focus, textarea:focus {
          outline: none;
          border-bottom-color: #dc2626;
        }
      `}</style>
      
      <div className="text-center mb-6 border-b-4 border-red-600 pb-4">
        <h1 className="text-3xl font-black mb-2">SPARTAN WEEKLY PLAN</h1>
        <p className="text-sm text-gray-600">Discipline • Empathy • Strategy</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Week Of:</label>
          <input id="week-of" name="week-of" type="text" className="mt-2 h-6" placeholder="e.g., Jan 15 to 19, 2026" />
        </div>
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Territory:</label>
          <input id="territory" name="territory" type="text" className="mt-2 h-6" placeholder="e.g., North Region" />
        </div>
      </div>

      <div className="bg-red-600 text-white p-3 mb-4">
        <h2 className="text-lg font-bold mb-1">THIS WEEK'S PRIMARY OBJECTIVE</h2>
        <p className="text-xs">What is the ONE outcome that would make this week successful?</p>
      </div>
      <textarea id="primary-objective" name="primary-objective" className="border-2 border-gray-300 p-4 mb-6 min-h-[80px] w-full" placeholder="e.g., Convert 3 Tier A accounts to active referrers"></textarea>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">DAILY PRIORITIES</h2>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <div key={day} className="mb-3 border border-gray-300 p-2">
            <div className="font-bold text-sm mb-1">{day.toUpperCase()}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-semibold">Top 3:</span>
                <input id={`${day.toLowerCase()}-priorities`} name={`${day.toLowerCase()}-priorities`} type="text" className="h-5" placeholder="Priority accounts" />
              </div>
              <div>
                <span className="font-semibold">Touches:</span>
                <input id={`${day.toLowerCase()}-touches`} name={`${day.toLowerCase()}-touches`} type="number" className="h-5" placeholder="0" />
              </div>
              <div>
                <span className="font-semibold">Notes:</span>
                <input id={`${day.toLowerCase()}-notes`} name={`${day.toLowerCase()}-notes`} type="text" className="h-5" placeholder="Notes" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2">KEY METRICS THIS WEEK</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center pb-1">
              <span>Meaningful Touches:</span>
              <input id="meaningful-touches" name="meaningful-touches" type="number" className="w-16 text-right" placeholder="0" />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Referrals Received:</span>
              <input id="referrals-received" name="referrals-received" type="number" className="w-16 text-right" placeholder="0" />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Admissions (SOC):</span>
              <input id="admissions-soc" name="admissions-soc" type="number" className="w-16 text-right" placeholder="0" />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Avg. Time to SOC:</span>
              <input id="avg-time-to-soc" name="avg-time-to-soc" type="text" className="w-16 text-right" placeholder="0h" />
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-300 p-3">
          <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2">TOP 5 FOCUS ACCOUNTS</h3>
          <div className="space-y-1 text-xs">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <span className="font-bold">{num}.</span>
                <input id={`focus-account-${num}`} name={`focus-account-${num}`} type="text" className="flex-1 h-6" placeholder="Account name" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-3 mb-4">
        <h3 className="font-bold text-sm mb-2">WEEKLY RECOVERY PLAN</h3>
        <p className="text-xs text-gray-600 mb-2">What will you do to recharge and avoid burnout?</p>
        <textarea id="recovery-plan" name="recovery-plan" className="border border-gray-400 bg-white p-2 min-h-[60px] w-full" placeholder="e.g., Friday evening family time, Saturday morning run"></textarea>
      </div>

      <div className="border-t-2 border-gray-300 pt-3">
        <h3 className="font-bold text-sm mb-2">END OF WEEK REFLECTION</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">What worked well?</label>
            <textarea id="worked-well" name="worked-well" className="border border-gray-400 p-2 min-h-[50px] w-full" placeholder="Wins and successes"></textarea>
          </div>
          <div>
            <label className="font-semibold block mb-1">What needs adjustment?</label>
            <textarea id="needs-adjustment" name="needs-adjustment" className="border border-gray-400 p-2 min-h-[50px] w-full" placeholder="Areas to improve"></textarea>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-300">
        © {new Date().getFullYear()} Spartan Coaching | spartancoaching.com
      </div>

      <div className="mt-6 text-center print:hidden">
        <Button onClick={() => {
          const getEmailPdf = (): EmailPdfPayload => ({
            title: "Weekly Sales Plan",
            filename: "spartan-weekly-plan",
            subtitle: "Hospice Sales Weekly Planning Template",
            sections: [
              { heading: "Monday — Pipeline Review", body: "Review all open referrals and pending admissions.\nFollow up on any referrals received Friday.\nConfirm the week's appointments.\nPriority A-tier visits: ___" },
              { heading: "Tuesday — Hospital & Physician Focus", body: "Hospital discharge planner rounds: 8-10am\nPhysician office visits: 10am-2pm\nTarget conversations: 5+\nNotes: ___" },
              { heading: "Wednesday — SNF & ALF Circuit", body: "SNF visits (target 3-4 facilities)\nALF check-ins\nLunch-and-learn (if scheduled)\nTarget conversations: 6+\nNotes: ___" },
              { heading: "Thursday — Follow-Ups & New Contacts", body: "Follow up with all warm contacts from Mon-Wed.\nNew facility introductions.\nTarget conversations: 5+\nNotes: ___" },
              { heading: "Friday — Admin & Relationship Building", body: "CRM updates and documentation.\nThank-you notes to referral sources.\nWeek-in-review: what worked, what didn't.\nPlan adjustments for next week.\n\nThis week's admissions: ___\nThis week's referrals: ___\nWhat needs adjustment: ___" },
            ],
          });
          capture(() => window.print(), getEmailPdf);
        }} size="lg" data-testid="button-print">
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>
      <LeadGateDialog gateState={gateState} />
    </div>
  );
}
