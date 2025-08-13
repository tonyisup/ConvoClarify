import { type Conversation, type InsertConversation, type Analysis, type InsertAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  
  // Analysis methods
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysisByConversationId(conversationId: string): Promise<Analysis | undefined>;
  deleteAnalysis(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, any>;
  private conversations: Map<string, Conversation>;
  private analyses: Map<string, Analysis>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.analyses = new Map();
  }

  async getUser(id: string): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      id,
      text: insertConversation.text,
      imageUrl: insertConversation.imageUrl || null,
      analysisDepth: insertConversation.analysisDepth || "standard",
      language: insertConversation.language || "english",
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = randomUUID();
    const analysis: Analysis = {
      id,
      conversationId: insertAnalysis.conversationId,
      speakers: insertAnalysis.speakers as string[],
      issues: insertAnalysis.issues as any[], // This will be properly typed from OpenAI response
      summary: insertAnalysis.summary as any, // This will be properly typed from OpenAI response
      clarityScore: insertAnalysis.clarityScore,
      createdAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysisByConversationId(conversationId: string): Promise<Analysis | undefined> {
    return Array.from(this.analyses.values()).find(
      (analysis) => analysis.conversationId === conversationId,
    );
  }

  async deleteAnalysis(id: string): Promise<void> {
    this.analyses.delete(id);
  }
}

export const storage = new MemStorage();
