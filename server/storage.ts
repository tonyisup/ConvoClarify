import { 
  type Conversation, 
  type InsertConversation, 
  type Analysis, 
  type InsertAnalysis, 
  type User, 
  type UpsertUser,
  type UserFeedback,
  type InsertUserFeedback,
  type SharedAnalysis,
  type InsertSharedAnalysis,
  type SubscriptionPlan,
  type UsageTracking,
  users, 
  conversations, 
  analyses,
  userFeedback,
  sharedAnalyses,
  subscriptionPlans,
  usageTracking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, count, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionEndsAt?: Date;
  }): Promise<User>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getUserConversationHistory(userId: string): Promise<(Conversation & { analysis?: Analysis })[]>;
  
  // Analysis methods
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysisByConversationId(conversationId: string): Promise<Analysis | undefined>;
  deleteAnalysis(id: string): Promise<void>;
  
  // User feedback methods
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  
  // Sharing methods
  createSharedAnalysis(share: InsertSharedAnalysis): Promise<SharedAnalysis>;
  getSharedAnalysis(shareToken: string): Promise<{ conversation: Conversation; analysis: Analysis; share: SharedAnalysis } | undefined>;
  incrementShareViewCount(shareToken: string): Promise<void>;
  
  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'createdAt'>): Promise<SubscriptionPlan>;
  
  // Usage tracking methods
  trackUsage(userId: string, action: string): Promise<void>;
  getUserMonthlyUsage(userId: string, month: string): Promise<number>;
  resetUserMonthlyUsage(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // For Google users, check if user already exists by googleId
    if (userData.authProvider === "google" && userData.googleId) {
      const existingUser = await this.getUserByGoogleId(userData.googleId);
      if (existingUser) {
        // Update existing user
        const [user] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.googleId, userData.googleId))
          .returning();
        return user;
      }
    }
    
    // For new users or Replit users, use standard upsert by ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionEndsAt?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getUserConversationHistory(userId: string): Promise<(Conversation & { analysis?: Analysis })[]> {
    // Get conversations with their analyses joined
    const result = await db
      .select({
        // Conversation fields
        id: conversations.id,
        userId: conversations.userId,
        text: conversations.text,
        imageUrls: conversations.imageUrls,
        analysisDepth: conversations.analysisDepth,
        language: conversations.language,
        aiModel: conversations.aiModel,
        reasoningLevel: conversations.reasoningLevel,
        createdAt: conversations.createdAt,
        // Analysis fields (optional)
        analysisId: analyses.id,
        speakers: analyses.speakers,
        issues: analyses.issues,
        summary: analyses.summary,
        clarityScore: analyses.clarityScore,
        analysisCreatedAt: analyses.createdAt,
      })
      .from(conversations)
      .leftJoin(analyses, eq(conversations.id, analyses.conversationId))
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));

    // Transform the flat result into the expected format
    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      text: row.text,
      imageUrls: row.imageUrls,
      analysisDepth: row.analysisDepth,
      language: row.language,
      aiModel: row.aiModel,
      reasoningLevel: row.reasoningLevel,
      createdAt: row.createdAt,
      analysis: row.analysisId ? {
        id: row.analysisId,
        conversationId: row.id,
        speakers: row.speakers!,
        issues: row.issues!,
        summary: row.summary!,
        clarityScore: row.clarityScore!,
        createdAt: row.analysisCreatedAt!,
      } : undefined,
    }));
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getAnalysisByConversationId(conversationId: string): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.conversationId, conversationId));
    return analysis;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await db.delete(analyses).where(eq(analyses.id, id));
  }

  async createUserFeedback(insertFeedback: InsertUserFeedback): Promise<UserFeedback> {
    const [feedback] = await db
      .insert(userFeedback)
      .values(insertFeedback)
      .returning();
    return feedback;
  }

  // Sharing methods
  async createSharedAnalysis(insertShare: InsertSharedAnalysis): Promise<SharedAnalysis> {
    const [share] = await db
      .insert(sharedAnalyses)
      .values(insertShare)
      .returning();
    return share;
  }

  async getSharedAnalysis(shareToken: string): Promise<{ conversation: Conversation; analysis: Analysis; share: SharedAnalysis } | undefined> {
    const result = await db
      .select({
        // Conversation fields
        conversationId: conversations.id,
        conversationUserId: conversations.userId,
        conversationText: conversations.text,
        conversationImageUrls: conversations.imageUrls,
        conversationAnalysisDepth: conversations.analysisDepth,
        conversationLanguage: conversations.language,
        conversationAiModel: conversations.aiModel,
        conversationReasoningLevel: conversations.reasoningLevel,
        conversationCreatedAt: conversations.createdAt,
        
        // Analysis fields
        analysisId: analyses.id,
        analysisConversationId: analyses.conversationId,
        analysisSpeakers: analyses.speakers,
        analysisIssues: analyses.issues,
        analysisSummary: analyses.summary,
        analysisClarityScore: analyses.clarityScore,
        analysisCreatedAt: analyses.createdAt,
        
        // Share fields
        shareId: sharedAnalyses.id,
        shareToken: sharedAnalyses.shareToken,
        shareCreatedBy: sharedAnalyses.createdBy,
        shareIsActive: sharedAnalyses.isActive,
        shareExpiresAt: sharedAnalyses.expiresAt,
        shareViewCount: sharedAnalyses.viewCount,
        shareCreatedAt: sharedAnalyses.createdAt,
      })
      .from(sharedAnalyses)
      .innerJoin(conversations, eq(sharedAnalyses.conversationId, conversations.id))
      .innerJoin(analyses, eq(sharedAnalyses.analysisId, analyses.id))
      .where(and(
        eq(sharedAnalyses.shareToken, shareToken),
        eq(sharedAnalyses.isActive, true)
      ));

    if (result.length === 0) {
      return undefined;
    }

    const row = result[0];
    
    return {
      conversation: {
        id: row.conversationId,
        userId: row.conversationUserId,
        text: row.conversationText,
        imageUrls: row.conversationImageUrls,
        analysisDepth: row.conversationAnalysisDepth,
        language: row.conversationLanguage,
        aiModel: row.conversationAiModel,
        reasoningLevel: row.conversationReasoningLevel,
        createdAt: row.conversationCreatedAt,
      },
      analysis: {
        id: row.analysisId,
        conversationId: row.analysisConversationId,
        speakers: row.analysisSpeakers,
        issues: row.analysisIssues,
        summary: row.analysisSummary,
        clarityScore: row.analysisClarityScore,
        createdAt: row.analysisCreatedAt,
      },
      share: {
        id: row.shareId,
        conversationId: row.conversationId,
        analysisId: row.analysisId,
        shareToken: row.shareToken,
        createdBy: row.shareCreatedBy,
        isActive: row.shareIsActive,
        expiresAt: row.shareExpiresAt,
        viewCount: row.shareViewCount,
        createdAt: row.shareCreatedAt,
      }
    };
  }

  async incrementShareViewCount(shareToken: string): Promise<void> {
    await db
      .update(sharedAnalyses)
      .set({
        viewCount: sql`${sharedAnalyses.viewCount} + 1`,
      })
      .where(eq(sharedAnalyses.shareToken, shareToken));
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'createdAt'>): Promise<SubscriptionPlan> {
    const [created] = await db.insert(subscriptionPlans).values(plan).returning();
    return created;
  }

  // Usage tracking methods
  async trackUsage(userId: string, action: string): Promise<void> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    await db.insert(usageTracking).values({
      userId,
      action,
      month,
      timestamp: now,
    });

    // Update user's monthly count if it's an analysis
    if (action === 'analysis') {
      const user = await this.getUser(userId);
      if (user) {
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const userMonth = user.lastAnalysisReset ? 
          `${user.lastAnalysisReset.getFullYear()}-${String(user.lastAnalysisReset.getMonth() + 1).padStart(2, '0')}` : 
          currentMonth;

        if (userMonth !== currentMonth) {
          // Reset monthly count for new month
          await db.update(users)
            .set({
              monthlyAnalysisCount: 1,
              lastAnalysisReset: now,
            })
            .where(eq(users.id, userId));
        } else {
          // Increment count
          await db.update(users)
            .set({
              monthlyAnalysisCount: (user.monthlyAnalysisCount || 0) + 1,
            })
            .where(eq(users.id, userId));
        }
      }
    }
  }

  async getUserMonthlyUsage(userId: string, month: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(usageTracking)
      .where(and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.month, month),
        eq(usageTracking.action, 'analysis')
      ));
    
    return result[0]?.count || 0;
  }

  async resetUserMonthlyUsage(userId: string): Promise<void> {
    await db.update(users)
      .set({
        monthlyAnalysisCount: 0,
        lastAnalysisReset: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
