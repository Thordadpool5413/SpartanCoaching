import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";

export default function WeeklyPlan() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO />
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: "Training Resources", href: "/resources" }, { label: "Weekly Plan" }]} />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          button, nav, header, footer { display: none !important; }
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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Week Of:</label>
          <input type="text" className="mt-2 h-6" placeholder="e.g., Jan 15-19, 2025" />
        </div>
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Territory:</label>
          <input type="text" className="mt-2 h-6" placeholder="e.g., North Region" />
        </div>
      </div>

      <div className="bg-red-600 text-white p-3 mb-4">
        <h2 className="text-lg font-bold mb-1">THIS WEEK'S PRIMARY OBJECTIVE</h2>
        <p className="text-xs">What is the ONE outcome that would make this week successful?</p>
      </div>
      <textarea className="border-2 border-gray-300 p-4 mb-6 min-h-[80px] w-full" placeholder="e.g., Convert 3 Tier A accounts to active referrers"></textarea>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">DAILY PRIORITIES</h2>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <div key={day} className="mb-3 border border-gray-300 p-2">
            <div className="font-bold text-sm mb-1">{day.toUpperCase()}</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-semibold">Top 3:</span>
                <input type="text" className="h-5" placeholder="Priority accounts" />
              </div>
              <div>
                <span className="font-semibold">Touches:</span>
                <input type="number" className="h-5" placeholder="0" />
              </div>
              <div>
                <span className="font-semibold">Notes:</span>
                <input type="text" className="h-5" placeholder="Notes" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2">KEY METRICS THIS WEEK</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center pb-1">
              <span>Meaningful Touches:</span>
              <input type="number" className="w-16 text-right" placeholder="0" />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Referrals Received:</span>
              <input type="number" className="w-16 text-right" placeholder="0" />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Admissions (SOC):</span>
              <input type="number" className="w-16 text-right" placeholder="0" />
            </div>
            <div className="flex justify-between items-center pb-1">
              <span>Avg. Time to SOC:</span>
              <input type="text" className="w-16 text-right" placeholder="0h" />
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-300 p-3">
          <h3 className="font-bold text-sm mb-2 bg-gray-100 p-2">TOP 5 FOCUS ACCOUNTS</h3>
          <div className="space-y-1 text-xs">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <span className="font-bold">{num}.</span>
                <input type="text" className="flex-1 h-6" placeholder="Account name" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-3 mb-4">
        <h3 className="font-bold text-sm mb-2">WEEKLY RECOVERY PLAN</h3>
        <p className="text-xs text-gray-600 mb-2">What will you do to recharge and avoid burnout?</p>
        <textarea className="border border-gray-400 bg-white p-2 min-h-[60px] w-full" placeholder="e.g., Friday evening family time, Saturday morning run"></textarea>
      </div>

      <div className="border-t-2 border-gray-300 pt-3">
        <h3 className="font-bold text-sm mb-2">END OF WEEK REFLECTION</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">What worked well?</label>
            <textarea className="border border-gray-400 p-2 min-h-[50px] w-full" placeholder="Wins and successes"></textarea>
          </div>
          <div>
            <label className="font-semibold block mb-1">What needs adjustment?</label>
            <textarea className="border border-gray-400 p-2 min-h-[50px] w-full" placeholder="Areas to improve"></textarea>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-300">
        © {new Date().getFullYear()} Spartan Coaching | spartancoaching.com
      </div>

      <div className="mt-6 text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
