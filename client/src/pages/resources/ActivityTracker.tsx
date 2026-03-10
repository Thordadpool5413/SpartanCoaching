import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ContentNotice } from "@/components/ContentNotice";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function DaySection({ day }: { day: string }) {
  const id = day.toLowerCase();
  return (
    <div className="day-section mb-6">
      <div className="bg-gray-900 text-white p-2 mb-2">
        <h2 className="text-base font-bold uppercase">{day}</h2>
      </div>
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Conversations</p>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid gap-1 mb-1 text-xs" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
            <div>
              <span className="text-gray-500 text-xs">Account:</span>
              <input id={`${id}-conv-${i + 1}-account`} name={`${id}-conv-${i + 1}-account`} type="text" />
            </div>
            <div>
              <span className="text-gray-500 text-xs">Contact:</span>
              <input id={`${id}-conv-${i + 1}-contact`} name={`${id}-conv-${i + 1}-contact`} type="text" />
            </div>
            <div>
              <span className="text-gray-500 text-xs">Topic:</span>
              <input id={`${id}-conv-${i + 1}-topic`} name={`${id}-conv-${i + 1}-topic`} type="text" />
            </div>
            <div>
              <span className="text-gray-500 text-xs">Stage:</span>
              <input id={`${id}-conv-${i + 1}-stage`} name={`${id}-conv-${i + 1}-stage`} type="text" />
            </div>
            <div>
              <span className="text-gray-500 text-xs">Outcome:</span>
              <input id={`${id}-conv-${i + 1}-outcome`} name={`${id}-conv-${i + 1}-outcome`} type="text" />
            </div>
          </div>
        ))}
      </div>

      <div className="daily-summary border border-gray-300 p-2 mb-2">
        <p className="text-xs font-bold text-red-600 mb-1">{day} Daily Summary</p>
        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
          <div>
            <span className="text-gray-600">Total conversations today:</span>
            <input id={`${id}-total-conversations`} name={`${id}-total-conversations`} type="number" className="short" />
          </div>
          <div>
            <span className="text-gray-600">Referrals received today:</span>
            <input id={`${id}-referrals`} name={`${id}-referrals`} type="number" className="short" />
          </div>
          <div>
            <span className="text-gray-600">Admissions confirmed today:</span>
            <input id={`${id}-admissions`} name={`${id}-admissions`} type="number" className="short" />
          </div>
        </div>
        <div className="text-xs">
          <span className="text-gray-600">Key win or insight from today:</span>
          <input id={`${id}-key-win`} name={`${id}-key-win`} type="text" />
        </div>
      </div>
    </div>
  );
}

export default function ActivityTracker() {
  const { capture, gateState } = useLeadGate("Weekly Activity Tracker");
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO title="Weekly Activity Tracker | Spartan Coaching" />
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: "Training Resources", href: "/resources" }, { label: "Weekly Activity Tracker" }]} />
        <ContentNotice />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 10px; }
          button, nav, header, footer { display: none !important; }
          .day-section { page-break-inside: avoid; break-inside: avoid; }
          .daily-summary { page-break-inside: avoid; break-inside: avoid; }
          .weekly-summary { page-break-inside: avoid; break-inside: avoid; }
          .no-break { page-break-inside: avoid; break-inside: avoid; }
        }
        input[type="text"], input[type="number"] {
          border: none;
          border-bottom: 1px solid #999;
          background: transparent;
          width: 100%;
          padding: 1px 2px;
          font-size: 11px;
        }
        input.short {
          width: 60px;
          display: inline-block;
        }
        input:focus {
          outline: none;
          border-bottom-color: #dc2626;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; font-size: 11px; }
      `}</style>

      <div className="text-center mb-4 border-b-4 border-red-600 pb-3 no-break">
        <h1 className="text-2xl font-black mb-1">SPARTAN COACHING</h1>
        <p className="text-xs font-semibold text-gray-500 tracking-widest mb-1">DISCIPLINE | EMPATHY | STRATEGY</p>
        <h2 className="text-lg font-bold">Weekly Activity Tracker</h2>
        <p className="text-xs text-gray-600">Track Daily Conversations, Referrals, and Admissions</p>
      </div>

      <div className="bg-gray-50 border-l-4 border-red-600 p-3 mb-6 no-break">
        <p className="text-xs font-bold mb-1">HOW TO USE THIS TRACKER</p>
        <p className="text-xs text-gray-700">Record each conversation with a referral source contact throughout the day. At the end of each day, tally your numbers and note any key takeaways. Review weekly totals every Friday to identify patterns and adjust your plan.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 no-break">
        <div className="border border-gray-300 p-2">
          <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Week Of:</label>
          <input id="week-of" name="week-of" type="text" placeholder="e.g., Jan 15 to 19, 2026" />
        </div>
        <div className="border border-gray-300 p-2">
          <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Rep Name:</label>
          <input id="rep-name" name="rep-name" type="text" placeholder="Your name" />
        </div>
      </div>

      {DAYS.map((day) => (
        <DaySection key={day} day={day} />
      ))}

      <div className="weekly-summary border-t-4 border-gray-900 pt-4 mb-6">
        <div className="bg-gray-900 text-white p-3 mb-3">
          <h2 className="text-base font-bold">WEEKLY SUMMARY AND REFLECTION</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Total conversations this week:</span>
              <input id="total-conversations-week" name="total-conversations-week" type="number" />
            </div>
            <div>
              <span className="text-gray-600">Total referrals received this week:</span>
              <input id="total-referrals-week" name="total-referrals-week" type="number" />
            </div>
            <div>
              <span className="text-gray-600">Total admissions this week:</span>
              <input id="total-admissions-week" name="total-admissions-week" type="number" />
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Conversation to referral conversion rate (referrals / conversations):</span>
              <input id="conversion-rate" name="conversion-rate" type="text" placeholder="e.g., 12%" />
            </div>
            <div>
              <span className="text-gray-600">New accounts visited for the first time:</span>
              <input id="new-accounts" name="new-accounts" type="number" />
            </div>
            <div>
              <span className="text-gray-600">Accounts that advanced a stage in the Sales Mastery Model:</span>
              <input id="advanced-accounts" name="advanced-accounts" type="number" />
            </div>
          </div>
        </div>

        <div className="no-break mb-4">
          <p className="text-xs font-bold text-red-600 mb-2">Weekly Reflection Questions</p>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-600">What conversation this week went best, and why?:</span>
              <input id="reflection-best" name="reflection-best" type="text" />
            </div>
            <div>
              <span className="text-gray-600">What conversation went poorly, and what would I do differently?:</span>
              <input id="reflection-poorly" name="reflection-poorly" type="text" />
            </div>
            <div>
              <span className="text-gray-600">Which accounts am I most concerned about and why?:</span>
              <input id="reflection-concerned" name="reflection-concerned" type="text" />
            </div>
            <div>
              <span className="text-gray-600">What is the one thing I will do differently next week?:</span>
              <input id="reflection-differently" name="reflection-differently" type="text" />
            </div>
          </div>
        </div>

        <div className="no-break border-2 border-red-600 p-4 bg-red-50">
          <p className="text-xs font-black text-red-700 mb-2">THE TRACKING DISCIPLINE</p>
          <p className="text-xs text-gray-800">Reps who track consistently outperform reps who do not, independent of any other variable. The data in your tracker is not for your manager. It is for you. It will tell you exactly where your process is breaking down. Trust it more than your gut. Your gut notices patterns too slowly. Your data catches them immediately.</p>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-300">
        Spartan Coaching | Hospice Sales Excellence | Confidential Training Material
      </div>

      <div className="mt-6 text-center print:hidden">
        <Button onClick={() => capture(() => window.print())} size="lg" data-testid="button-print">
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>
      <LeadGateDialog gateState={gateState} />
    </div>
  );
}
