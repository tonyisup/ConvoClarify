import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertAnalysisSchema } from "@shared/schema";
import { analyzeConversation } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid conversation data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get a conversation by ID
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to retrieve conversation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Analyze a conversation
  app.post("/api/conversations/:id/analyze", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if analysis already exists
      const existingAnalysis = await storage.getAnalysisByConversationId(conversation.id);
      if (existingAnalysis) {
        return res.json(existingAnalysis);
      }

      // Perform analysis using OpenAI
      const analysisResult = await analyzeConversation(
        conversation.text,
        conversation.analysisDepth,
        conversation.language
      );

      // Store the analysis
      const analysisData = insertAnalysisSchema.parse({
        conversationId: conversation.id,
        speakers: analysisResult.speakers,
        issues: analysisResult.issues,
        summary: analysisResult.summary,
        clarityScore: analysisResult.clarityScore,
      });

      const analysis = await storage.createAnalysis(analysisData);
      
      // Return analysis with parsed messages for frontend
      res.json({
        ...analysis,
        messages: analysisResult.messages
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to analyze conversation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get analysis by conversation ID
  app.get("/api/conversations/:id/analysis", async (req, res) => {
    try {
      const analysis = await storage.getAnalysisByConversationId(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to retrieve analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
