import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ContentNotice } from "@/components/ContentNotice";

export default function ObjectionCards() {
  const objections = [
    {
      objection: "We already have a hospice provider",
      response: "I completely understand, and I'm not here to replace anyone. What I've found is that having a backup option gives you flexibility when response times are critical. Would it be okay if I stay in touch so you know who to call if you ever need a faster turnaround?",
      tip: "Never bash competitors. Position yourself as a secondary option for urgent cases."
    },
    {
      objection: "The family isn't ready",
      response: "That's very common, and it's a hard conversation. What I've learned is that an evaluation doesn't commit anyone. It just gives the family information so they can make the best decision when they're ready. Would it help if we scheduled a low-pressure assessment?",
      tip: "Reframe evaluation as information gathering, not a commitment."
    },
    {
      objection: "They're not sick enough yet",
      response: "I appreciate you being thoughtful about timing. In my experience, early hospice actually improves quality of life. Patients get better symptom management and family support earlier. Would it make sense to at least get an assessment now so the family knows what's available when they need it?",
      tip: "Educate on early hospice benefits without pressuring."
    },
    {
      objection: "We tried hospice before and it didn't work",
      response: "I'm sorry to hear that. Can you tell me what didn't work? [Listen] That must have been frustrating. Every hospice operates differently, and I'd love the chance to show you how we approach [specific pain point]. Would you be open to giving us one case to prove ourselves?",
      tip: "Acknowledge the pain, listen fully, then offer a low-risk trial."
    },
    {
      objection: "How is your agency different?",
      response: "Great question. The three things I hear most from our referrers are: [1] our response time averages under 2 hours, [2] our clinical team is available 24/7 including nights and weekends, and [3] we have specialized training in [dementia/CHF/cancer]. Which of those matters most to your patients?",
      tip: "Lead with 3 specific differentiators, then ask what matters to them."
    },
    {
      objection: "Your company is too small/large",
      response: "I understand the concern. Being [smaller/larger] actually allows us to [be more responsive/have specialized teams]. What specific worries do you have about our size? I'd like to address those directly.",
      tip: "Turn size into an advantage, then uncover the real concern."
    },
    {
      objection: "I need to check with my supervisor first",
      response: "Absolutely. I'd never want you to bypass your process. Would it help if I put together a one-page summary of our services that you can share? Or would your supervisor prefer I reach out directly to introduce myself?",
      tip: "Respect hierarchy. Offer to make their job easier."
    },
    {
      objection: "Can you just email me your information?",
      response: "I'd be happy to send you a quick overview. Since I know you're busy, would it be helpful if we scheduled a brief call next week so I can answer any questions after you've had a chance to review it? That way, when a case comes up, you'll know exactly when to reach out.",
      tip: "Send info but secure a follow-up commitment. Avoid being ghosted."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white text-black print:p-0">
      <SEO />
      <div className="print:hidden">
        <Breadcrumbs items={[{ label: "Training Resources", href: "/resources" }, { label: "Objection Cards" }]} />
        <ContentNotice />
      </div>
      <style>{`
        @media print {
          body { margin: 0; padding: 10px; }
          button, nav, header, footer { display: none !important; }
          .card { page-break-inside: avoid; }
          div.bg-yellow-50, div.bg-gray-50, div.border-2, div.border-l-4 {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
      
      <div className="text-center mb-6 border-b-4 border-red-600 pb-4">
        <h1 className="text-h1 font-black mb-2">OBJECTION RESPONSE CARDS</h1>
        <p className="text-sm text-gray-600">Pocket-sized responses for the 8 most common hospice objections</p>
        <p className="text-xs text-gray-500 mt-2">Print double-sided, cut along lines, and laminate for field use</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4">
        {objections.map((item, idx) => (
          <div key={idx} className="card border-2 border-gray-400 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
            <div className="bg-red-600 text-white px-3 py-2 rounded-t-lg -mx-4 -mt-4 mb-3">
              <h3 className="font-bold text-sm">OBJECTION #{idx + 1}</h3>
            </div>
            
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">They Say:</p>
              <p className="font-bold text-sm italic border-l-4 border-red-600 pl-2">"{item.objection}"</p>
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">You Say:</p>
              <p className="text-xs border-l-4 border-gray-300 pl-2 italic">{item.response}</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-2">
              <p className="text-xs font-semibold mb-1">Pro Tip:</p>
              <p className="text-xs">{item.tip}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-900 text-white p-6 rounded-lg">
        <h2 className="font-black text-h2 mb-3">THE UNIVERSAL FRAMEWORK</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-bold mb-2 text-red-400">1. ACKNOWLEDGE</h3>
            <p className="text-xs">"I understand..." "That makes sense..." "I hear you..."</p>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-red-400">2. REFRAME</h3>
            <p className="text-xs">Shift perspective without being pushy. Educate, don't pressure.</p>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-red-400">3. ASK</h3>
            <p className="text-xs">"Would it help if...?" "Could we...?" "What if we tried...?"</p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-300">
        © {new Date().getFullYear()} Spartan Coaching | spartancoaching.com
      </div>

      <div className="mt-6 text-center print:hidden">
        <Button onClick={() => window.print()} size="lg" data-testid="button-print">
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>
    </div>
  );
}
