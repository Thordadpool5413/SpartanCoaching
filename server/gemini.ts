import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Hospice sales coaching system instruction for all AI interactions
 */
const SPARTAN_SYSTEM_INSTRUCTION = `You are an expert hospice sales coach with deep knowledge of the hospice industry, Medicare regulations, and sales best practices. Your role is to provide practical, actionable guidance that helps hospice sales professionals build relationships, overcome objections, and serve their communities with integrity and empathy.

Core Principles:
- Always prioritize patient care and ethical practices
- Focus on building trust and long-term relationships
- Provide specific, actionable advice with real examples
- Use the Spartan Method pillars: Discipline, Empathy, Strategy
- Keep responses professional yet conversational`;

/**
 * Generate a complex, detailed response (for playbooks)
 */
export async function generateComplexResponse(prompt: string, systemInstruction?: string): Promise<string> {
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || SPARTAN_SYSTEM_INSTRUCTION,
      },
    });

    return result.text || "";
  } catch (error: any) {
    console.error("Gemini API error (complex response):", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Generate a quick, concise response (for objections, quick coaching)
 */
export async function generateQuickResponse(prompt: string): Promise<string> {
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        systemInstruction: SPARTAN_SYSTEM_INSTRUCTION,
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    return result.text || "";
  } catch (error: any) {
    console.error("Gemini API error (quick response):", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Generate grounded search results with web sources
 * Note: Grounding requires Vertex AI. For API key usage, we'll use regular generation.
 */
export async function generateGroundedSearch(query: string): Promise<{
  text: string;
  sources?: Array<{ title: string; uri: string }>;
}> {
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Research this hospice sales question and provide a detailed, well-researched answer with specific facts and best practices: ${query}`,
      config: {
        systemInstruction: `You are a hospice industry research assistant. Provide accurate, well-researched information about hospice care, Medicare regulations, sales strategies, and industry best practices. When possible, mention specific sources of information.`,
        temperature: 0.3,
      },
    });

    const text = result.text || "";

    // For API key usage, we don't have grounding metadata
    return { text, sources: undefined };
  } catch (error: any) {
    console.error("Gemini API error (research):", error);
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
  
  // Use a combination of day and week to pseudo-randomly select a drill
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
    // Build conversation history - format as alternating user/model messages
    let conversationText = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationText = conversationHistory.map(msg => 
        `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      ).join("\n\n") + "\n\n";
    }
    
    conversationText += `User: ${message}`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: conversationText,
      config: {
        systemInstruction: SPARTAN_SYSTEM_INSTRUCTION,
        maxOutputTokens: 1000,
        temperature: 0.8,
      },
    });

    return result.text || "";
  } catch (error: any) {
    console.error("Gemini API error (chat):", error);
    throw new Error(`Chat generation failed: ${error.message}`);
  }
}
