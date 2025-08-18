import { 
  type Conversation, 
  type InsertConversation, 
  type Analysis, 
  type InsertAnalysis, 
  type User, 
  type UpsertUser,
  type SubscriptionPlan,
  type UsageTracking,
  users, 
  conversations, 
  analyses,
  subscriptionPlans,
  usageTracking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, count } from "drizzle-orm";
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
  
  // Analysis methods
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysisByConversationId(conversationId: string): Promise<Analysis | undefined>;
  deleteAnalysis(id: string): Promise<void>;
  
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
