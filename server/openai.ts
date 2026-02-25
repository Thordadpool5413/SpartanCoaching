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
export async function generateDailyDrill(): Promise<{ drill: string; category: string; index: number }> {
  const drills = [
    { category: "Prospecting", drill: "Review your territory map and identify the top 3 referral sources you have not contacted in 30 days. Send each a personalized value message today." },
    { category: "Prospecting", drill: "Identify 5 new potential referral sources in your territory that you have never visited. Research each one and plan your approach for this week." },
    { category: "Prospecting", drill: "Create a value drop for your top prospect. Find a relevant article, case study, or industry insight to share with no sales ask attached." },
    { category: "Communication", drill: "Practice your elevator pitch 3 times out loud. Time yourself. Can you deliver it confidently in under 60 seconds?" },
    { category: "Communication", drill: "Record yourself explaining hospice benefits to a family member. Listen back and identify filler words, unclear explanations, or missed empathy moments." },
    { category: "Communication", drill: "Write three different opening statements for cold calls. Test which feels most natural and authentic to your style." },
    { category: "Objection Handling", drill: "Identify one common objection you heard this week. Write out 3 different empathetic responses and practice them." },
    { category: "Objection Handling", drill: "Practice the Feel, Felt, Found technique. Write responses to 'Hospice means giving up,' 'We are not ready,' and 'We already have a hospice provider.'" },
    { category: "Objection Handling", drill: "Role-play handling the objection 'The patient is not ready for hospice yet' with three different approaches: clinical, emotional, and practical." },
    { category: "Relationship Building", drill: "Research one of your top referral partners. Find a recent news article or achievement about them to reference in your next visit." },
    { category: "Relationship Building", drill: "Send a handwritten thank-you note to a referral source who sent you a patient this month. Mention something specific about the case." },
    { category: "Relationship Building", drill: "Schedule a lunch-and-learn at a facility you want to grow. Prepare a 10-minute educational presentation on a hospice topic they would value." },
    { category: "Follow-Up", drill: "Review your follow-up list. Choose 3 prospects and send them valuable content (article, tip, resource) with no sales ask." },
    { category: "Follow-Up", drill: "Create a 30-60-90 day follow-up plan for your newest referral source. Map out touchpoints, value drops, and check-ins." },
    { category: "Self-Reflection", drill: "Reflect on your last 5 conversations. What questions did you ask? Write down 3 better discovery questions for next time." },
    { category: "Self-Reflection", drill: "Review your win/loss ratio this month. For each lost opportunity, identify the moment the conversation went sideways and what you would do differently." },
    { category: "Planning", drill: "Map out your ideal week. Block time for prospecting, follow-ups, education, and relationship building. Stick to it today." },
    { category: "Planning", drill: "Analyze your top 10 accounts by revenue potential. Are you spending enough time on your highest-value opportunities?" },
    { category: "Clinical Knowledge", drill: "Study one hospice eligibility diagnosis you are less familiar with. Learn the specific decline indicators and practice explaining them simply." },
    { category: "Clinical Knowledge", drill: "Review the four levels of hospice care. Practice explaining when each is appropriate in language a non-clinical person would understand." },
    { category: "Prospecting", drill: "Look at your calendar for the next two weeks. Identify any day where you have fewer than 4 conversations scheduled and fill those gaps with new or existing account visits right now." },
    { category: "Prospecting", drill: "List your top 5 referral sources from last quarter. Have any of them gone quiet? If so, plan a specific value touch for each one this week." },
    { category: "Communication", drill: "Think about the last referral you received. Write a thank you message to the person who sent it. Be specific about the patient outcome and why the referral mattered." },
    { category: "Communication", drill: "Practice explaining the difference between palliative care and hospice in 30 seconds or less. Say it out loud three times until it sounds natural." },
    { category: "Objection Handling", drill: "Write out your response to this exact phrase: 'Our patients are not ready for hospice.' Then practice delivering it with genuine curiosity rather than defensiveness." },
    { category: "Relationship Building", drill: "Pick one discharge planner you have a good relationship with. Ask them this week what the biggest challenge they are facing at work is. Just listen." },
    { category: "Relationship Building", drill: "Identify a referral source you lost this year. Write down what happened and what you would do differently. Consider whether it is worth re-engaging." },
    { category: "Follow-Up", drill: "Open your CRM or contact list. Find every referral source you spoke with last week and make sure each one has a clear next step documented." },
    { category: "Self-Reflection", drill: "Rate your energy level today on a scale of 1 to 10. If it is below a 7, identify one thing you can change about your routine tomorrow to show up sharper." },
    { category: "Planning", drill: "Write down your top 3 priorities for this week. Not tasks, priorities. Then check if your calendar actually reflects those priorities or if you are spending time on things that do not move the needle." },
    { category: "Clinical Knowledge", drill: "Pick one hospice eligibility diagnosis you are less confident discussing. Read the LCD criteria for that diagnosis and write down the three most important decline indicators in your own words." },
    { category: "Clinical Knowledge", drill: "Practice explaining what a FAST Scale score of 7A means to a nurse who asks why their dementia patient might qualify for hospice. Keep it under 60 seconds." },
  ];

  const date = new Date();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % drills.length;

  return {
    drill: drills[index].drill,
    category: drills[index].category,
    index,
  };
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

const CHARACTER_DESCRIPTIONS: Record<string, string> = {
  "cold_call_snf": "You are playing the role of a busy, somewhat skeptical Skilled Nursing Facility (SNF) Director of Nursing. You are interrupted during a hectic day. You have had bad experiences with hospice companies that over-promised and under-delivered. You care deeply about your residents but are protective of your time. Start somewhat dismissive but can be won over with genuine value and respect for your time. React naturally by asking questions, pushing back, and expressing concerns about transitions of care.",
  "physician_objection": "You are playing the role of a physician who is hesitant to refer patients to hospice. You believe in aggressive treatment and feel hospice means giving up. You worry about patient and family reactions. You are busy and data-driven. You need evidence that hospice improves outcomes. Push back on emotional appeals and instead ask for clinical data, quality metrics, and clear eligibility criteria.",
  "family_consultation": "You are playing the role of an adult child whose elderly parent has been diagnosed with a terminal illness. You are emotional, scared, and confused about what hospice means. You have misconceptions. You think hospice means no more treatment, that it is only for the last few days, and that choosing it means abandoning your parent. Ask lots of questions and express fear and guilt.",
  "hospital_discharge": "You are playing the role of a hospital discharge planner who is overworked and juggling many cases. You have worked with several hospice companies and are comparing them. You care about smooth transitions, reliable communication, and companies that follow through. Test the sales rep on their responsiveness, coverage areas, and what makes them different.",
  "assisted_living_admin": "You are playing the role of an Assisted Living facility administrator. You are concerned about how hospice presence affects your community's atmosphere and your staff's workload. You want to know about training, coordination, and how the hospice team will integrate with your staff. You are open but cautious.",
  "competitor_territory": "You are playing the role of a referral source (case manager) who currently uses a competitor hospice company and is generally satisfied. You are not actively looking to switch. The sales rep needs to find gaps in your current service and offer compelling reasons to consider an alternative without badmouthing the competitor.",
};

export async function generateRoleplayResponse(
  scenarioId: string,
  scenarioTitle: string,
  userMessage: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const characterPrompt = CHARACTER_DESCRIPTIONS[scenarioId] ||
      `You are playing a role in a hospice sales practice scenario: "${scenarioTitle}". Stay in character as the person the hospice sales representative is meeting with. React realistically and naturally.`;

    const systemInstruction = `${characterPrompt}

IMPORTANT RULES:
- Stay completely in character. Never break character or offer coaching tips during the conversation.
- Respond as this person would naturally respond, with their concerns, questions, objections, and communication style.
- Keep responses conversational and realistic (2 to 4 sentences typically, sometimes longer if the character would naturally elaborate).
- React to what the sales rep says. If they say something good, warm up slightly. If they are too pushy, push back harder.
- Do not make it too easy. Real prospects have real concerns and are not easily convinced.
- Never mention that you are an AI or that this is a practice exercise.`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemInstruction },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: userMessage });

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      max_completion_tokens: 500,
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      return "I need a moment to think about that.";
    }
    return text;
  } catch (error: any) {
    console.error("OpenAI API error (roleplay response):", error);
    return "I need a moment to think about that. Can you tell me more?";
  }
}

export async function generateRoleplayFeedback(
  scenarioTitle: string,
  transcript: Array<{ role: string; content: string }>
): Promise<{ feedback: string; rating: number }> {
  try {
    const conversationText = transcript.map(msg =>
      `${msg.role === "user" ? "Sales Rep" : "Prospect/Contact"}: ${msg.content}`
    ).join("\n\n");

    const prompt = `Analyze this hospice sales role-play practice conversation and provide detailed coaching feedback.

SCENARIO: ${scenarioTitle}

CONVERSATION TRANSCRIPT:
${conversationText}

Please provide your analysis using the following structure with markdown headings:

## Overall Rating
Rate the sales rep's performance from 1 to 10 and start this section with "RATING: N" on the first line.

## What Went Well
Specific things the rep did effectively (with quotes from the conversation).

## Areas for Improvement
Specific weaknesses with actionable suggestions the rep can apply next time.

## Spartan Method Analysis
How well did they demonstrate:
- Discipline (preparation, structure, follow-through)
- Empathy (active listening, understanding concerns)
- Strategy (value positioning, objection handling, next steps)

## Key Takeaway
One most important thing to practice before the next conversation.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert hospice sales coach providing detailed, constructive feedback on practice role-play sessions. Be specific, reference actual quotes from the conversation, and provide actionable coaching advice based on the Spartan Method (Discipline, Empathy, Strategy). Be encouraging but honest.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content || "";

    const ratingMatch = text.match(/RATING:\s*(\d+)/i);
    const rating = ratingMatch ? Math.min(10, Math.max(1, parseInt(ratingMatch[1]))) : 5;

    const feedback = text.replace(/RATING:\s*\d+\n?/i, "").trim();

    return { feedback, rating };
  } catch (error: any) {
    console.error("OpenAI API error (roleplay feedback):", error);
    throw new Error(`Roleplay feedback generation failed: ${error.message}`);
  }
}
