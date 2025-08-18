import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for multi-provider auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider").default("replit"), // replit, google
  googleId: varchar("google_id").unique(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, active, canceled, past_due
  subscriptionPlan: varchar("subscription_plan").default("free"), // free, pro, premium
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  monthlyAnalysisCount: integer("monthly_analysis_count").default(0),
  lastAnalysisReset: timestamp("last_analysis_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  text: text("text").notNull(),
  imageUrl: text("image_url"), // Optional screenshot URL
  analysisDepth: text("analysis_depth").notNull().default("standard"),
  language: text("language").notNull().default("english"),
  aiModel: varchar("ai_model").default("gpt-4o-mini"), // gpt-4o-mini, gpt-4o, claude-3-5-sonnet
  reasoningLevel: varchar("reasoning_level").default("standard"), // standard, detailed, comprehensive
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
  userId: true,
  text: true,
  imageUrl: true,
  analysisDepth: true,
  language: true,
  aiModel: true,
  reasoningLevel: true,
}).extend({
  imageUrl: z.string().optional(),
  aiModel: z.string().optional(),
  reasoningLevel: z.string().optional(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  conversationId: true,
  speakers: true,
  issues: true,
  summary: true,
  clarityScore: true,
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  stripePriceId: varchar("stripe_price_id").notNull(),
  monthlyAnalysisLimit: integer("monthly_analysis_limit").notNull(),
  price: integer("price").notNull(), // in cents
  features: jsonb("features").$type<string[]>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking table
export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // "analysis", "reanalysis", "export"
  timestamp: timestamp("timestamp").defaultNow(),
  month: varchar("month").notNull(), // YYYY-MM format for easy querying
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UsageTracking = typeof usageTracking.$inferSelect;

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
