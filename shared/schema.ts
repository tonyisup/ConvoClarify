import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  imageUrl: text("image_url"), // Optional screenshot URL
  analysisDepth: text("analysis_depth").notNull().default("standard"),
  language: text("language").notNull().default("english"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  speakers: jsonb("speakers").$type<string[]>().notNull(),
  issues: jsonb("issues").$type<AnalysisIssue[]>().notNull(),
  summary: jsonb("summary").$type<AnalysisSummary>().notNull(),
  clarityScore: integer("clarity_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  text: true,
  imageUrl: true,
  analysisDepth: true,
  language: true,
}).extend({
  imageUrl: z.string().optional(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  conversationId: true,
  speakers: true,
  issues: true,
  summary: true,
  clarityScore: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

export interface AnalysisIssue {
  id: string;
  type: "critical" | "moderate" | "minor";
  category: "assumption_gap" | "ambiguous_language" | "tone_mismatch" | "implicit_meaning";
  title: string;
  description: string;
  highlightedText: string;
  lineNumbers: number[];
  whyConfusing: string[];
  suggestedImprovement: string;
  speakerInterpretations?: {
    speaker: string;
    interpretation: string;
  }[];
}

export interface AnalysisSummary {
  criticalIssues: number;
  moderateIssues: number;
  minorIssues: number;
  suggestions: number;
  mainCategories: string[];
}

export interface ConversationMessage {
  speaker: string;
  content: string;
  timestamp?: string;
  lineNumber: number;
}
