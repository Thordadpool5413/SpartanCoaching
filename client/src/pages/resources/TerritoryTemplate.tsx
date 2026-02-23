import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";

export default function TerritoryTemplate() {
  return (
    <div className="max-w-5xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO />
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: "Training Resources", href: "/resources" }, { label: "Territory Template" }]} />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          button, nav, header, footer { display: none !important; }
          .page-break { page-break-before: always; }
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px; font-size: 11px; }
        th { background: #dc2626; color: white; font-weight: bold; }
        input {
          border: none;
          background: transparent;
          width: 100%;
          padding: 2px;
          font-size: 11px;
        }
        input:focus {
          outline: 1px solid #dc2626;
        }
      `}</style>
      
      <div className="text-center mb-6 border-b-4 border-red-600 pb-4">
        <h1 className="text-3xl font-black mb-2">TERRITORY PLANNING TEMPLATE</h1>
        <p className="text-sm text-gray-600">Map your market, prioritize accounts, build your route</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Territory Name:</label>
          <input type="text" className="mt-2 h-6 border-b-2 border-dotted border-gray-400" placeholder="e.g., North Region" />
        </div>
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Coverage Area:</label>
          <input type="text" className="mt-2 h-6 border-b-2 border-dotted border-gray-400" placeholder="e.g., Counties A, B, C" />
        </div>
        <div className="border-2 border-gray-300 p-3">
          <label className="text-xs font-bold text-gray-600 uppercase">Last Updated:</label>
          <input type="text" className="mt-2 h-6 border-b-2 border-dotted border-gray-400" placeholder="e.g., Jan 2026" />
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-red-600 text-white p-3 mb-3">
          <h2 className="text-lg font-bold">ACCOUNT PRIORITY MATRIX</h2>
          <p className="text-xs">Rank accounts by potential and current engagement</p>
        </div>

        <table>
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th className="w-48">Account Name</th>
              <th className="w-32">Type</th>
              <th className="w-32">Key Contact</th>
              <th className="w-24">Phone</th>
              <th className="w-20">Priority</th>
              <th className="w-32">Last Touch</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(25)].map((_, i) => (
              <tr key={i}>
                <td className="text-center text-gray-400">{i + 1}</td>
                <td><input type="text" placeholder="Account name" /></td>
                <td><input type="text" placeholder="Hospital/ALF/MD" /></td>
                <td><input type="text" placeholder="Contact name" /></td>
                <td><input type="tel" placeholder="Phone" /></td>
                <td><input type="text" placeholder="A/B/C" maxLength={1} /></td>
                <td><input type="text" placeholder="MM/DD" /></td>
                <td><input type="text" placeholder="Notes" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="page-break mb-8">
        <div className="bg-gray-900 text-white p-3 mb-3">
          <h2 className="text-lg font-bold">PRIORITY DEFINITIONS</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-red-600 p-4 bg-red-50">
            <h3 className="font-black text-lg mb-2 text-red-600">TIER A</h3>
            <p className="text-sm font-semibold mb-2">High-Value Accounts</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Currently referring competitors</li>
              <li>High patient volume</li>
              <li>Decision-maker identified</li>
              <li>Geographic proximity</li>
            </ul>
            <div className="mt-3 bg-red-600 text-white p-2 text-xs font-bold">
              VISIT: Weekly minimum
            </div>
          </div>
          <div className="border-2 border-yellow-600 p-4 bg-yellow-50">
            <h3 className="font-black text-lg mb-2 text-yellow-700">TIER B</h3>
            <p className="text-sm font-semibold mb-2">Medium-Value Accounts</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Moderate patient volume</li>
              <li>Some hospice referrals</li>
              <li>Relationship building needed</li>
              <li>Worth maintaining presence</li>
            </ul>
            <div className="mt-3 bg-yellow-600 text-white p-2 text-xs font-bold">
              VISIT: Bi-weekly
            </div>
          </div>
          <div className="border-2 border-gray-400 p-4 bg-gray-50">
            <h3 className="font-black text-lg mb-2 text-gray-600">TIER C</h3>
            <p className="text-sm font-semibold mb-2">Low-Priority Accounts</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Low patient volume</li>
              <li>Rarely refer to hospice</li>
              <li>Far from territory center</li>
              <li>Touch occasionally</li>
            </ul>
            <div className="mt-3 bg-gray-600 text-white p-2 text-xs font-bold">
              VISIT: Monthly or as-needed
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-red-600 text-white p-3 mb-3">
          <h2 className="text-lg font-bold">WEEKLY ROUTE PLAN</h2>
          <p className="text-xs">Cluster visits by geography to maximize face-time</p>
        </div>

        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <div key={day} className="mb-4 border-2 border-gray-300 p-3">
            <h3 className="font-bold text-sm mb-2 bg-gray-100 px-2 py-1">{day.toUpperCase()}</h3>
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="w-16">Time</th>
                  <th className="w-40">Account</th>
                  <th className="w-32">Contact</th>
                  <th className="w-32">Purpose</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="text-center">
                      <input type="text" placeholder={i === 0 ? '9:00' : i === 1 ? '10:30' : i === 2 ? '12:00' : i === 3 ? '2:00' : '3:30'} />
                    </td>
                    <td><input type="text" placeholder="Account" /></td>
                    <td><input type="text" placeholder="Contact" /></td>
                    <td><input type="text" placeholder={i === 2 ? 'Lunch' : 'Purpose'} /></td>
                    <td><input type="text" placeholder="Outcome" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-4 border-l-4 border-red-600">
        <h3 className="font-bold text-sm mb-2">SPARTAN ROUTE PLANNING TIPS</h3>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li><strong>Geographic Clustering:</strong> Group visits by area to reduce drive time</li>
          <li><strong>Peak Hours:</strong> Visit hospitals 8-10am and 2-4pm (before/after rounds)</li>
          <li><strong>Lunch Strategy:</strong> Schedule lunch-and-learns or use for admin work</li>
          <li><strong>Buffer Time:</strong> Leave 15min between appointments for unexpected delays</li>
          <li><strong>Friday Follow-ups:</strong> Reserve Friday afternoons for relationship-building calls</li>
        </ul>
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
