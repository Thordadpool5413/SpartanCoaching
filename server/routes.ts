import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  generateComplexResponse,
  generateQuickResponse,
  generateGroundedSearch,
  generateDailyDrill,
  generateChatResponse,
} from "./gemini";
import {
  playbookRequestSchema,
  objectionRequestSchema,
  researchRequestSchema,
  aiRequestSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Playbook Generator
  app.post("/api/playbooks", async (req, res) => {
    try {
      const { scenario, desiredOutcomes } = playbookRequestSchema.parse(req.body);
      
      const prompt = `Create a detailed hospice sales playbook for the following scenario:

${scenario}

${desiredOutcomes ? `Desired Outcomes: ${desiredOutcomes}\n\n` : ""}
Please provide:
1. Scenario overview and context
2. Step-by-step actionable strategies
3. Specific talking points and scripts
4. Key takeaways and success metrics

Format the playbook in markdown with clear sections, bullet points, and quoted talking points.`;

      const systemInstruction = `You are an expert hospice sales coach creating detailed, actionable playbooks. Each playbook should include specific strategies, talking points in quotes, and clear action steps. Focus on building trust, demonstrating value, and ethical sales practices aligned with the Spartan Method (Discipline, Empathy, Strategy).`;

      const playbook = await generateComplexResponse(prompt, systemInstruction);
      
      res.json({ playbook });
    } catch (error: any) {
      console.error("Playbook generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate playbook" });
    }
  });

  // AI Objection Handler
  app.post("/api/objections", async (req, res) => {
    try {
      const { objection } = objectionRequestSchema.parse(req.body);
      
      const prompt = `A family or referral source says: "${objection}"

Provide a concise, empathetic response that:
1. Acknowledges their concern
2. Addresses the objection with compassion
3. Offers a next step or question to continue the conversation

Keep it under 100 words and use a warm, professional tone.`;

      const response = await generateQuickResponse(prompt);
      
      res.json({ response });
    } catch (error: any) {
      console.error("Objection handling error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // AI Research Tool
  app.post("/api/research", async (req, res) => {
    try {
      const { query } = researchRequestSchema.parse(req.body);
      
      const result = await generateGroundedSearch(query);
      
      res.json(result);
    } catch (error: any) {
      console.error("Research error:", error);
      res.status(500).json({ error: error.message || "Failed to perform research" });
    }
  });

  // Daily Drill Generator
  app.get("/api/daily-drill", async (req, res) => {
    try {
      const drill = await generateDailyDrill();
      
      res.json({ drill });
    } catch (error: any) {
      console.error("Daily drill error:", error);
      res.status(500).json({ error: error.message || "Failed to generate daily drill" });
    }
  });

  // AI Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, conversationHistory } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await generateChatResponse(prompt, conversationHistory);
      
      res.json({ response });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to generate chat response" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
