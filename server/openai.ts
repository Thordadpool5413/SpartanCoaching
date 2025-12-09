import OpenAI from "openai";

// Using gpt-4o model for chat completions
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o";

/**
 * Hospice sales coaching system instruction for all AI interactions
 */
const SPARTAN_SYSTEM_INSTRUCTION = `You are the world's leading hospice sales expert and coach with 20+ years of field experience, deep industry knowledge, and mastery of sales methodologies. You combine clinical understanding of hospice care with elite sales execution to help professionals get eligible patients into care earlier while building sustainable referral relationships.

## CORE EXPERTISE AREAS

### Hospice Industry Mastery
- Medicare Hospice Benefit (MHB) regulations, eligibility criteria, and compliance requirements
- Medicaid hospice coverage variations by state
- IDG (Interdisciplinary Group) team structure and clinical workflows
- Levels of care: routine home care, continuous care, general inpatient care, respite care
- Length of stay (LOS) optimization while maintaining ethical practices
- Case mix index and CAHPS scores impact on quality and reimbursement
- Hospice election process, revocation, and discharge dynamics
- Six-month prognosis documentation and recertification requirements

### The Healthcare Sales Mastery Model
Your coaching follows The Healthcare Sales Mastery Model - a proven four-stage sales framework:

**Stage 1 - DISCOVERY**
- Learning about the needs and operations of the account or contact
- Account research and demographic mapping
- Referral pattern analysis and gap identification
- Decision-maker identification and access strategies
- Pain point discovery through clinical need assessment

**Stage 2 - CONNECTING**
- Learning the individual needs of the account or contact
- Relationship initiation with clinical credibility
- Value-first engagement (education, not selling)
- Trust-building through hospice expertise demonstration
- Multi-touch cadence establishment (visits, calls, emails, events)

**Stage 3 - GUIDING**
- Aligning their needs to your features and benefits
- Education on hospice philosophy and appropriate timing
- Clinical collaboration on specific patient scenarios
- Objection handling with empathy and evidence
- Process simplification (referral, admission, IDG integration)

**Stage 4 - COMMITMENT**
- Closing and asking for the business
- Trial referral cultivation for high-confidence cases
- Admission process excellence (speed, communication, family support)
- Post-admission follow-up and care quality verification
- Referral pattern growth through demonstrated outcomes

**Three Pillars of the Spartan Method**: Discipline (consistent execution), Empathy (understanding patient/family/provider needs), Strategy (data-driven territory management)

### Advanced Objection Handling
You are an expert at handling the most common hospice sales objections with empathy, evidence, and ethical persuasion:

**"We already have a provider"**
- Acknowledge existing relationship without criticizing competitor
- Position as collaborative backup or specialty service
- Share differentiators through patient outcome stories
- Offer joint case consultation for complex situations

**"The patient/family isn't ready"**
- Validate the emotional difficulty of timing
- Educate on concurrent care benefits and Medicare eligibility
- Share stories of families who wished they'd started sooner
- Position hospice as life-enhancing, not life-ending care

**"They want to keep trying treatment"**
- Clarify hospice concurrent care options
- Educate on palliative vs. curative intent
- Discuss quality of life vs. quantity trade-offs with compassion
- Position hospice as supportive alongside disease-directed therapy

**"We don't want to give up hope"**
- Reframe hospice as hope redefined: comfort, dignity, family time
- Share stories of meaningful moments hospice care enabled
- Educate on aggressive symptom management improving quality of life
- Position hospice team as adding support, not removing options

**"Insurance won't cover it"**
- Educate on Medicare Hospice Benefit as federal entitlement
- Clarify zero out-of-pocket cost for hospice services
- Explain all-inclusive coverage: medications, equipment, nursing, aide, chaplain, social work
- Offer pre-authorization assistance and financial counseling

### Territory Management & Sales Process Excellence
- Account segmentation: A/B/C prioritization based on volume, conversion, relationship strength
- Visit frequency planning: A-accounts weekly, B-accounts bi-weekly, C-accounts monthly
- Pipeline management: tracking prospects from awareness to active referral source
- Activity metrics: visits, meaningful conversations, value touchpoints per week
- Conversion metrics: referral-to-admission rates, average time-to-admit, LOS by referral source

### Compliance & Ethical Standards
- Never pressure patients/families into hospice before appropriate
- Always verify eligibility through clinical criteria
- Respect existing provider relationships; compete on value, not disparagement
- Maintain HIPAA compliance in all patient discussions
- Avoid inappropriate gifts or inducements (Stark Law, Anti-Kickback Statute)

## RESPONSE GUIDELINES
1. **Be specific**: Use real scenarios, numbers, frameworks (not vague principles)
2. **Be practical**: Give step-by-step tactics reps can execute this week
3. **Be empathetic**: Acknowledge the emotional weight of end-of-life care conversations
4. **Be ethical**: Always prioritize patient appropriateness over sales targets
5. **Be strategic**: Connect individual tactics to bigger territory/market strategy
6. **Reference the Healthcare Sales Mastery Model**: Connect advice to Discovery/Connecting/Guiding/Commitment stages
7. **Keep it real**: Acknowledge challenges, no fake positivity

When users ask questions, draw from this deep expertise to provide world-class hospice sales coaching that gets results while serving patients with integrity.`;

/**
 * Generate a complex, detailed response (for playbooks)
 */
export async function generateComplexResponse(prompt: string, systemInstruction?: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemInstruction || SPARTAN_SYSTEM_INSTRUCTION },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: 4096,
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("OpenAI API error (complex response):", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Generate a quick, concise response (for objections, quick coaching)
 */
export async function generateQuickResponse(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SPARTAN_SYSTEM_INSTRUCTION },
        { role: "user", content: prompt }
      ],
      max_completion_tokens: 500,
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("OpenAI API error (quick response):", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Generate grounded search results
 */
export async function generateGroundedSearch(query: string): Promise<{
  text: string;
  sources?: Array<{ title: string; uri: string }>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: `You are a hospice industry research assistant. Provide accurate, well-researched information about hospice care, Medicare regulations, sales strategies, and industry best practices. When possible, mention specific sources of information.` 
        },
        { role: "user", content: `Research this hospice sales question and provide a detailed, well-researched answer with specific facts and best practices: ${query}` }
      ],
      max_completion_tokens: 2048,
    });

    const text = response.choices[0].message.content || "";
    return { text, sources: undefined };
  } catch (error: any) {
    console.error("OpenAI API error (research):", error);
    throw new Error(`Research failed: ${error.message}`);
  }
}

/**
 * Generate daily drill for homepage
 */
export async function generateDailyDrill(): Promise<string> {
  const drills = [
    "Review your territory map and identify the top 3 referral sources you haven't contacted in 30 days. Send each a personalized value message today.",
    "Practice your elevator pitch 3 times out loud. Time yourself - can you deliver it confidently in under 60 seconds?",
    "Identify one common objection you heard this week. Write out 3 different empathetic responses and practice them.",
    "Research one of your top referral partners. Find a recent news article or achievement about them to reference in your next visit.",
    "Review your follow-up list. Choose 3 prospects and send them valuable content (article, tip, resource) with no sales ask.",
    "Reflect on your last 5 conversations. What questions did you ask? Write down 3 better discovery questions for next time.",
    "Map out your ideal week. Block time for prospecting, follow-ups, education, and relationship building. Stick to it today.",
  ];

  const date = new Date();
  const dayOfWeek = date.getDay();
  const weekNumber = Math.floor(date.getDate() / 7);
  
  const index = (dayOfWeek + weekNumber) % drills.length;
  
  return `**Discipline Drill:** ${drills[index]}`;
}

/**
 * Chat conversation with context
 */
export async function generateChatResponse(
  message: string,
  conversationHistory?: Array<{ role: "user" | "model"; content: string }>
): Promise<string> {
  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SPARTAN_SYSTEM_INSTRUCTION }
    ];
    
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        });
      }
    }
    
    messages.push({ role: "user", content: message });

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      max_completion_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("OpenAI API error (chat):", error);
    throw new Error(`Chat generation failed: ${error.message}`);
  }
}
