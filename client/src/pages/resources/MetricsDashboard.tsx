import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";

export default function MetricsDashboard() {
  return (
    <div className="max-w-5xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO />
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: "Training Resources", href: "/resources" }, { label: "Metrics Dashboard" }]} />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          button, nav, header, footer { display: none !important; }
        }
        input[type="text"], input[type="number"] {
          border: none;
          border-bottom: 2px dotted #666;
          background: transparent;
          width: 100%;
          padding: 4px;
          font-size: 14px;
        }
      `}</style>
      
      <div className="text-center mb-6 border-b-4 border-red-600 pb-4">
        <h1 className="text-3xl font-black mb-2">METRICS DASHBOARD</h1>
        <p className="text-sm text-gray-600">Track what matters: Referrals, Conversions, Speed to Care</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Month:</label>
          <input type="text" className="mt-1" placeholder="January 2025" />
        </div>
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Territory:</label>
          <input type="text" className="mt-1" placeholder="North Region" />
        </div>
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Liaison:</label>
          <input type="text" className="mt-1" placeholder="Your Name" />
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-red-600 text-white p-3 mb-4">
          <h2 className="text-lg font-bold mb-1">ACTIVITY METRICS</h2>
          <p className="text-xs">How much work are you putting in?</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="border-2 border-gray-300 p-4">
            <h3 className="text-sm font-bold mb-3 bg-gray-100 p-2">TOUCHES & VISITS</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Total Meaningful Touches</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="text-2xl font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">Goal: 80+/month</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Face-to-Face Visits</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="text-2xl font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">Goal: 60+/month</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Phone/Email Touches</label>
                <input type="number" className="font-bold" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Lunch & Learns / Events</label>
                <input type="number" className="font-bold" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="border-2 border-gray-300 p-4">
            <h3 className="text-sm font-bold mb-3 bg-gray-100 p-2">ACCOUNT COVERAGE</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Total Active Accounts</label>
                <input type="number" className="text-2xl font-bold" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Tier A Accounts</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">Weekly visits</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Tier B Accounts</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">Bi-weekly</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Tier C Accounts</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">Monthly</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-gray-900 text-white p-3 mb-4">
          <h2 className="text-lg font-bold mb-1">CONVERSION METRICS</h2>
          <p className="text-xs">Are your activities turning into results?</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="border-2 border-red-600 bg-red-50 p-4">
            <h3 className="text-sm font-bold mb-3 text-red-700">REFERRALS RECEIVED</h3>
            <input type="number" className="text-4xl font-black text-center mb-2 bg-transparent border-b-4 border-red-600" placeholder="0" />
            <p className="text-xs text-center text-gray-600">Goal: 8-12/month</p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>From Hospitals:</span>
                <input type="number" className="w-16 text-right bg-transparent" placeholder="0" />
              </div>
              <div className="flex justify-between">
                <span>From ALF/SNF:</span>
                <input type="number" className="w-16 text-right bg-transparent" placeholder="0" />
              </div>
              <div className="flex justify-between">
                <span>From Physicians:</span>
                <input type="number" className="w-16 text-right bg-transparent" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="border-2 border-green-600 bg-green-50 p-4">
            <h3 className="text-sm font-bold mb-3 text-green-700">ADMISSIONS (SOC)</h3>
            <input type="number" className="text-4xl font-black text-center mb-2 bg-transparent border-b-4 border-green-600" placeholder="0" />
            <p className="text-xs text-center text-gray-600">Goal: 6-8/month</p>
            <div className="mt-4 text-xs">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Conversion Rate:</span>
                <div className="flex items-center gap-1">
                  <input type="number" className="w-12 text-right bg-transparent" placeholder="0" />
                  <span>%</span>
                </div>
              </div>
              <p className="text-gray-600">SOC ÷ Referrals × 100</p>
              <p className="text-green-700 font-semibold mt-2">Target: 60-70%</p>
            </div>
          </div>

          <div className="border-2 border-blue-600 bg-blue-50 p-4">
            <h3 className="text-sm font-bold mb-3 text-blue-700">AVG. TIME TO SOC</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <input type="number" className="text-4xl font-black text-center w-24 bg-transparent border-b-4 border-blue-600" placeholder="0" />
              <span className="text-xl font-bold">hrs</span>
            </div>
            <p className="text-xs text-center text-gray-600">Goal: &lt;24 hours</p>
            <div className="mt-4 text-xs space-y-1">
              <div className="bg-white p-2 rounded">
                <p className="font-semibold mb-1">Breakdown:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>0-12 hrs:</span>
                    <input type="number" className="w-12 text-right" placeholder="0" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>13-24 hrs:</span>
                    <input type="number" className="w-12 text-right" placeholder="0" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>25+ hrs:</span>
                    <input type="number" className="w-12 text-right" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-red-600 text-white p-3 mb-4">
          <h2 className="text-lg font-bold mb-1">TOP REFERRAL SOURCES</h2>
          <p className="text-xs">Which accounts are driving results?</p>
        </div>

        <div className="border-2 border-gray-300">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="p-2 text-left">Rank</th>
                <th className="p-2 text-left">Account Name</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-center">Referrals</th>
                <th className="p-2 text-center">SOC</th>
                <th className="p-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((rank) => (
                <tr key={rank} className="border-b border-gray-300">
                  <td className="p-2 font-bold text-center">{rank}</td>
                  <td className="p-2"><input type="text" className="w-full" /></td>
                  <td className="p-2"><input type="text" className="w-full" placeholder="Hospital/ALF/MD" /></td>
                  <td className="p-2"><input type="number" className="w-full text-center" /></td>
                  <td className="p-2"><input type="number" className="w-full text-center" /></td>
                  <td className="p-2"><input type="text" className="w-full text-center" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border-2 border-gray-300 p-4">
          <h3 className="text-sm font-bold mb-3 bg-green-100 p-2 border-l-4 border-green-600">WINS THIS MONTH</h3>
          <textarea className="w-full border border-gray-300 p-2 min-h-[100px] text-sm" placeholder="What went well? New accounts? Strong conversions?"></textarea>
        </div>
        <div className="border-2 border-gray-300 p-4">
          <h3 className="text-sm font-bold mb-3 bg-yellow-100 p-2 border-l-4 border-yellow-600">NEEDS IMPROVEMENT</h3>
          <textarea className="w-full border border-gray-300 p-2 min-h-[100px] text-sm" placeholder="What needs work? Slow response times? Low conversion?"></textarea>
        </div>
      </div>

      <div className="bg-gray-100 border-l-4 border-red-600 p-4">
        <h3 className="font-bold text-sm mb-2">NEXT MONTH'S FOCUS</h3>
        <textarea className="w-full border border-gray-300 p-2 min-h-[60px] text-sm" placeholder="Based on this month's data, what will you prioritize next month?"></textarea>
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
