import { BackButton } from "@/components/BackButton";
import { SEO } from "@/components/SEO";

export default function QuickStartGuide() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO />
      <div className="print:hidden">
        <BackButton />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          button, nav, header, footer { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>
      
      <div className="text-center mb-6 border-b-4 border-red-600 pb-4">
        <h1 className="text-h1 font-black mb-2">QUICK START GUIDE</h1>
        <h2 className="text-h2 font-bold text-gray-700">Your First 30 Days as a Hospice Liaison</h2>
        <p className="text-sm text-gray-600 mt-2">Discipline • Empathy • Strategy</p>
      </div>

      <div className="bg-red-600 text-white p-4 mb-6">
        <h3 className="text-h3 font-bold mb-2">Welcome to Hospice Sales</h3>
        <p className="text-sm">This guide will help you build credibility, establish relationships, and generate your first referrals in 30 days. Focus on fundamentals, not shortcuts.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-h2 font-black mb-4 border-b-2 border-gray-300 pb-2">WEEK 1: FOUNDATION</h2>
        
        <div className="mb-4">
          <h3 className="text-h3 font-bold mb-2">Days 1-2: Learn Your Value Proposition</h3>
          <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-3">
            <p className="font-semibold mb-2">Action Items:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Review Medicare Hospice Benefit (MHB) coverage and eligibility</li>
              <li>Memorize your agency's key differentiators (24/7 support, team size, specialties)</li>
              <li>Practice your 30-second elevator pitch until it feels natural</li>
              <li>Shadow a clinical team member on a home visit (if possible)</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-3 border-l-4 border-blue-600 text-sm">
            <p className="font-semibold">✓ Success Metric:</p>
            <p>You can explain hospice eligibility and your agency's value in under 60 seconds.</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-h3 font-bold mb-2">Days 3-5: Map Your Territory</h3>
          <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-3">
            <p className="font-semibold mb-2">Action Items:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>List all hospitals, assisted living facilities, and physician offices in your area</li>
              <li>Identify which accounts currently refer to your competitors</li>
              <li>Create a spreadsheet: Name, Type, Contact, Last Touch, Priority (A/B/C)</li>
              <li>Plan your weekly route to maximize efficiency (geographic clustering)</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-3 border-l-4 border-blue-600 text-sm">
            <p className="font-semibold">✓ Success Metric:</p>
            <p>You have a complete territory map with 50+ identified referral sources.</p>
          </div>
        </div>
      </div>

      <div className="page-break mb-8">
        <h2 className="text-h2 font-black mb-4 border-b-2 border-gray-300 pb-2">WEEK 2: FIRST CONTACTS</h2>
        
        <div className="mb-4">
          <h3 className="text-h3 font-bold mb-2">Days 6-10: Introduction Visits</h3>
          <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-3">
            <p className="font-semibold mb-2">Your Script for First Visits:</p>
            <div className="bg-white p-3 border border-gray-300 text-sm italic mb-3">
              "Hi, I'm [Name] with [Agency]. I wanted to introduce myself since I'll be your primary contact for hospice referrals. My job is to make the referral process as smooth as possible for you and your patients. Do you have a quick minute? I'd love to understand what works best for your workflow."
            </div>
            <p className="font-semibold mb-2">Action Items:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Make 15-20 introduction visits this week (3-4 per day)</li>
              <li>Focus on assisted living and physician offices (easier access than hospitals)</li>
              <li>Ask: "What's your preferred way to reach out for hospice evaluations?"</li>
              <li>Leave a business card and one-page hospice eligibility guide</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-3 border-l-4 border-blue-600 text-sm">
            <p className="font-semibold">✓ Success Metric:</p>
            <p>15+ face-to-face introductions. You know 10+ contacts by name.</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-h2 font-black mb-4 border-b-2 border-gray-300 pb-2">WEEK 3: BUILD RHYTHM</h2>
        
        <div className="mb-4">
          <h3 className="text-h3 font-bold mb-2">Days 11-15: Establish Weekly Touchpoints</h3>
          <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-3">
            <p className="font-semibold mb-2">Action Items:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Revisit your top 10 accounts from Week 2</li>
              <li>Bring value: clinical case story, regulatory update, or lunch-and-learn offer</li>
              <li>Ask about current census and upcoming discharges</li>
              <li>Schedule a specific day/time for your weekly check-ins</li>
            </ul>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-h3 font-bold mb-2">Days 16-20: Handle Your First Objection</h3>
          <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-3">
            <p className="font-semibold mb-2">Common Objection #1: "We already have a hospice provider."</p>
            <div className="bg-white p-3 border border-gray-300 text-sm italic mb-3">
              "I completely understand—and I'm not here to replace anyone. What I've found is that having a backup option gives you flexibility when response times are critical. Would it be okay if I stay in touch so you know who to call if you ever need a faster turnaround?"
            </div>
            <p className="font-semibold mb-2">Common Objection #2: "The family isn't ready."</p>
            <div className="bg-white p-3 border border-gray-300 text-sm italic mb-3">
              "That's very common, and it's a hard conversation. What I've learned is that an evaluation doesn't commit anyone—it just gives the family information so they can make the best decision when they're ready. Would it help if we scheduled a low-pressure assessment?"
            </div>
          </div>
          <div className="bg-blue-50 p-3 border-l-4 border-blue-600 text-sm">
            <p className="font-semibold">✓ Success Metric:</p>
            <p>You've handled 3+ objections using empathy and reframing.</p>
          </div>
        </div>
      </div>

      <div className="page-break mb-8">
        <h2 className="text-h2 font-black mb-4 border-b-2 border-gray-300 pb-2">WEEK 4: GENERATE REFERRALS</h2>
        
        <div className="mb-4">
          <h3 className="text-h3 font-bold mb-2">Days 21-25: Close Your First Referral</h3>
          <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-3">
            <p className="font-semibold mb-2">Action Items:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Follow up on all pending evaluations from Week 3</li>
              <li>When you get a referral, respond within 2 hours (even if just to acknowledge)</li>
              <li>After admission, circle back to thank the referrer within 24 hours</li>
              <li>Ask: "What made this referral smooth? How can I make it easier next time?"</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-3 border-l-4 border-blue-600 text-sm">
            <p className="font-semibold">✓ Success Metric:</p>
            <p>1-2 referrals converted to admissions. Feedback loop established.</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-h3 font-bold mb-2">Days 26-30: Reflect and Optimize</h3>
          <div className="bg-gray-50 p-4 border-l-4 border-red-600 mb-3">
            <p className="font-semibold mb-2">Reflection Questions:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Which accounts are most responsive? Double down there.</li>
              <li>Which visits felt awkward? What can you improve?</li>
              <li>What objections do you still struggle with? Practice more.</li>
              <li>What's your average time from referral to start of care?</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white p-6">
        <h2 className="text-h2 font-black mb-3">YOUR 30-DAY SCORECARD</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border border-gray-600 p-3">
            <p className="font-semibold mb-1">Meaningful Touches:</p>
            <p className="text-2xl font-bold">______</p>
            <p className="text-xs text-gray-400">Goal: 60+</p>
          </div>
          <div className="border border-gray-600 p-3">
            <p className="font-semibold mb-1">Face-to-Face Visits:</p>
            <p className="text-2xl font-bold">______</p>
            <p className="text-xs text-gray-400">Goal: 40+</p>
          </div>
          <div className="border border-gray-600 p-3">
            <p className="font-semibold mb-1">Referrals Received:</p>
            <p className="text-2xl font-bold">______</p>
            <p className="text-xs text-gray-400">Goal: 3-5</p>
          </div>
          <div className="border border-gray-600 p-3">
            <p className="font-semibold mb-1">Admissions (SOC):</p>
            <p className="text-2xl font-bold">______</p>
            <p className="text-xs text-gray-400">Goal: 1-2</p>
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
